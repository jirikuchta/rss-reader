import re
from datetime import datetime
from enum import Enum
from functools import cached_property
from hashlib import md5
from typing import Optional, List, Dict
from xml.etree import ElementTree as ET

from flask import current_app as app

from lib.utils import http_request, ensure_abs_url, HTTPResponseError
from lib.htmlparser import FeedLinkParser, FeedLink, TextParser


def parse(url: str) -> "FeedParser":
    try:
        with http_request(url, "HEAD") as res:
            content_type = res.headers.get_content_type()
    except HTTPResponseError:
        content_type = None

    if content_type == "text/html":
        with http_request(url) as res:
            html = res.read().decode(res.headers.get_content_charset("utf-8"))

        feed_link_parser = FeedLinkParser(html, url)

        if len(feed_link_parser.links) > 1:
            raise AmbiguousFeedUrl(feed_link_parser.links)

        if len(feed_link_parser.links) == 1:
            url = feed_link_parser.links[0]["href"]

    with http_request(url) as res:
        node = ET.fromstring(res.read().strip())

    return FeedParser(node, url)


def text(n: Optional[ET.Element]) -> Optional[str]:
    return TextParser.parse(n.text) if n is not None and n.text else None


def html(n: Optional[ET.Element]) -> Optional[str]:
    # TODO: sanitize and ensure abs urls
    return n.text.strip() if n is not None and n.text else None


def attr(n: Optional[ET.Element], name: str) -> Optional[str]:
    return n.attrib.get(name) if n is not None else None


NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "dc": "http://purl.org/dc/elements/1.1/",
    "content": "http://purl.org/rss/1.0/modules/content/"}


class AmbiguousFeedUrl(Exception):
    def __init__(self, feed_links: FeedLink):
        super().__init__()
        self.feed_links = feed_links


class ParserError(Exception):
    pass


class FeedType(Enum):
    RSS = 1
    ATOM = 2


class RootNode:

    def __init__(self, node: ET.Element, feed_type: FeedType) -> None:
        self._node = node
        self._feed_type = feed_type

    @property
    def node(self):
        return self._node

    @property
    def feed_type(self):
        return self._feed_type

    @property
    def type(self):
        return self._type

    @cached_property
    def hash(self) -> str:
        return md5(ET.tostring(self.node)).hexdigest()

    @cached_property
    def namespaces(self) -> Dict[str, str]:
        match = re.match(r"{(\S+)}", self.node.tag)
        return {**({"": match.groups()[0]} if match else {}), **NS}

    def find(self, tag: str) -> Optional[ET.Element]:
        node = self.node.find(tag, self.namespaces)
        return node if node is not None else None

    def findall(self, tag: str) -> List[ET.Element]:
        return self.node.findall(tag, self.namespaces)


class FeedParser(RootNode):

    def __init__(self, node: ET.Element, feed_url: str) -> None:
        self._feed_url = feed_url

        feed_type = FeedType.ATOM

        if node.tag == "rss":
            feed_type = FeedType.RSS
            node = RootNode(node, feed_type).find("channel") or node

        super().__init__(node, feed_type)

    def __str__(self):
        return f"<{type(self).__name__} {self.feed_url}>"

    def __repr__(self):
        return (f"<{type(self).__name__} {ET.tostring(self._node)}>")

    @property
    def base_url(self) -> str:
        return self.web_url or self._feed_url

    @property
    def feed_url(self) -> str:
        return self._feed_url

    @cached_property
    def title(self) -> Optional[str]:
        return text(self.find("title"))

    @cached_property
    def web_url(self) -> Optional[str]:
        url = None

        if self.feed_type is FeedType.RSS:
            url = text(self.find("link"))

        if self.feed_type is FeedType.ATOM:
            url = attr(next(filter(
                lambda n: n.attrib.get("rel") in (None, "alternate"),
                self.findall("link")), None), "href")

        return None if url is None else ensure_abs_url(self._feed_url, url)

    @cached_property
    def items(self) -> List["FeedItemParser"]:
        items: List[FeedItemParser] = []
        tag = "item" if self.feed_type is FeedType.RSS else "entry"

        for node in self.findall(tag):
            try:
                items.append(
                    FeedItemParser(node, self.feed_type, self.base_url))
            except Exception as e:
                app.logger.warning(f"Failed to parse feed item, err={e}")
                app.logger.debug(ET.tostring(node))

        return items


class FeedItemParser(RootNode):

    def __init__(self, node: ET.Element, feed_type: FeedType, base_url: str):
        super().__init__(node, feed_type)
        self._base_url = base_url

    def __str__(self):
        return f"<{type(self).__name__} {self.guid}>"

    def __repr__(self):
        return (f"<{type(self).__name__} {ET.tostring(self._node)}>")

    @cached_property
    def guid(self) -> str:
        tag = "guid" if self.feed_type is FeedType.RSS else "id"
        return text(self.find(tag)) or self.url or self.hash

    @cached_property
    def title(self) -> Optional[str]:
        return text(self.find("title"))

    @cached_property
    def url(self) -> Optional[str]:
        url = None

        if self.feed_type is FeedType.RSS:
            url = text(self.find("link"))

            if not url:
                guid_node = self.find("guid")
                if attr(guid_node, "isPermalink") == "true":
                    url = text(guid_node)

            if not url:
                url = attr(next(filter(
                    lambda n: n.attrib.get("rel") in (None, "alternate"),
                    self.findall("atom:link")), None), "href")

        if self.feed_type is FeedType.ATOM:
            url = attr(next(filter(
                lambda n: n.attrib.get("rel") in (None, "alternate"),
                self.findall("link")), None), "href")

        return ensure_abs_url(self._base_url, url) if url else None

    @cached_property
    def summary(self) -> Optional[str]:
        tag = "description" if self.feed_type is FeedType.RSS else "summary"
        return text(self.find(tag)) or text(self.find("content:encoded"))

    @cached_property
    def content(self) -> Optional[str]:
        tag = "description" if self.feed_type is FeedType.RSS else "content"
        return html(self.find("content:encoded")) or html(self.find(tag))

    @cached_property
    def time_published(self) -> Optional[datetime]:
        tag = "pubDate" if self.feed_type is FeedType.RSS else "published"
        date_str = text(self.find(tag))

        if date_str is None:
            return None

        if self.feed_type is FeedType.RSS:
            valid_formats = [
                "%a, %d %b %Y %H:%M:%S %z",
                "%a, %d %b %Y %H:%M:%S %Z"]
        else:
            valid_formats = [
                "%Y-%m-%dT%H:%M:%S%z",
                "%Y-%m-%dT%H:%M:%S.%f%z"]

        for date_format in valid_formats:
            try:
                return datetime.utcfromtimestamp(
                    datetime.strptime(date_str, date_format).timestamp())
            except ValueError:
                pass

        return None

    @cached_property
    def comments_url(self) -> Optional[str]:
        url = text(self.find("comments"))

        if not url and self.feed_type is FeedType.ATOM:
            url = attr(next(filter(
                lambda n: n.attrib.get("rel") == "replies",
                self.findall("link")), None), "href")

        return ensure_abs_url(self._base_url, url) if url else None

    @cached_property
    def author(self) -> Optional[str]:
        if self.feed_type is FeedType.RSS:
            return text(self.find("author")) or text(self.find("dc:creator"))

        if self.feed_type is FeedType.ATOM:
            nodes = self.findall("author")
            names = [m for m in [text(n.find("name")) for n in nodes] if m]
            return ", ".join(names) or None

        return None
