from datetime import datetime
from enum import Enum
from functools import cached_property
from hashlib import md5
from html.parser import HTMLParser
from typing import Optional, List, Dict
from xml.etree import ElementTree as ET

from flask import current_app as app

from lib.utils import request, ensure_abs_url


def parse(feed_url: str) -> "FeedParser":
    with request(feed_url) as res:
        return FeedParser(ET.fromstring(res.read()), feed_url)


def inner_text(n: Optional[ET.Element]) -> Optional[str]:
    return TextParser.parse(n.text) if n is not None and n.text else None


def inner_safe_html(n: Optional[ET.Element]) -> Optional[str]:
    # TODO: sanitize and ensure abs urls
    return n.text if n is not None and n.text else None


NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "dc": "http://purl.org/dc/elements/1.1/",
    "content": "http://purl.org/rss/1.0/modules/content/"}


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
    def namespaces(self) -> Dict[str, str]:
        is_atom = self.feed_type is FeedType.ATOM
        return {**({"": NS["atom"]} if is_atom else {}), **NS}

    def find(self, tag: str) -> Optional[ET.Element]:
        node = self.node.find(tag, self.namespaces)
        return node if node is not None else None

    def findall(self, tag: str) -> List[ET.Element]:
        return self.node.findall(tag, self.namespaces)


class FeedParser(RootNode):

    def __init__(self, node: ET.Element, feed_url: str) -> None:
        self._feed_url = feed_url

        is_rss = node.tag == "rss"
        super().__init__(node, FeedType.RSS if is_rss else FeedType.ATOM)

        if self.feed_type is FeedType.RSS:
            channel_node = self.node.find("channel")
            if channel_node is None:
                raise ParserError("Missing requied <channel> node.")
            self._node = channel_node

    def __str__(self):
        return f"<{type(self).__name__} {self.feed_url}>"

    def __repr__(self):
        return (
            f"<{type(self).__name__}("
            f"ElementTree.fromString({ET.tostring(self._node)}))>")

    @property
    def base_url(self) -> str:
        return self.web_url or self._feed_url

    @property
    def feed_url(self) -> str:
        return self._feed_url

    @cached_property
    def title(self) -> Optional[str]:
        return inner_text(self.find("title"))

    @cached_property
    def web_url(self) -> Optional[str]:
        if self.feed_type is FeedType.RSS:
            url = inner_text(self.find("title"))
        else:  # atom
            node = next(filter(
                lambda n: n.attrib.get("rel") in (None, "alternate"),
                self.findall("link")), None)
            url = None if node is None else node.attrib.get("href")

        return None if url is None else ensure_abs_url(self._feed_url, url)

    @cached_property
    def items(self) -> List["FeedItemParser"]:
        items: List[FeedItemParser] = []
        tag = "item" if self.feed_type is FeedType.RSS else "entry"

        for node in self.findall(tag):
            try:
                items.append(FeedItemParser(node, self))
            except Exception as e:
                app.logger.warning("Failed to parse feed item, err=%s", e)
                app.logger.debug(ET.tostring(node))

        return items


class FeedItemParser(RootNode):

    def __init__(self, node: ET.Element, feed: FeedParser):
        super().__init__(node, feed.feed_type)
        self._feed = feed

    def __str__(self):
        return f"<{type(self).__name__} {self.guid}>"

    def __repr__(self):
        return (
            f"<{type(self).__name__}("
            f"ElementTree.fromString({ET.tostring(self._node)}))>")

    @cached_property
    def guid(self) -> str:
        tag = "guid" if self.feed_type is FeedType.RSS else "id"
        return inner_text(self.find(tag)) or self.url or self.hash

    @cached_property
    def hash(self) -> str:
        return md5(ET.tostring(self.node)).hexdigest()

    @cached_property
    def title(self) -> Optional[str]:
        return inner_text(self.find("title"))

    @cached_property
    def url(self) -> Optional[str]:
        if self.feed_type is FeedType.RSS:
            url = inner_text(self.find("link"))

            if not url:
                guid_node = self.find("guid")
                if guid_node and guid_node.attrib.get("isPermalink") == "true":
                    url = inner_text(guid_node)
        else:  # atom
            node = next(filter(
                lambda n: n.attrib.get("rel") in (None, "alternate"),
                self.findall("link")), None)
            url = None if node is None else node.attrib.get("href")

        return ensure_abs_url(self._feed.base_url, url) if url else None

    @cached_property
    def summary(self) -> Optional[str]:
        tag = "description" if self.feed_type is FeedType.RSS else "summary"
        return inner_text(self.find(tag)) \
            or inner_text(self.find("content:encoded"))

    @cached_property
    def content(self) -> Optional[str]:
        tag = "description" if self.feed_type is FeedType.RSS else "content"
        return inner_safe_html(self.find("content:encoded")) \
            or inner_safe_html(self.find(tag))

    @cached_property
    def time_published(self) -> Optional[datetime]:
        tag = "pubDate" if self.feed_type is FeedType.RSS else "published"
        date_str = inner_text(self.find(tag))

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
        url = inner_text(self.find("comments"))

        if not url and self.feed_type is FeedType.ATOM:
            node = next(filter(lambda n: n.attrib.get("rel") == "replies",
                               self.findall("link")), None)
            url = None if node is None else node.attrib.get("href")

        return ensure_abs_url(self._feed.base_url, url) if url else None

    @cached_property
    def author(self) -> Optional[str]:
        if self.feed_type is FeedType.RSS:
            return inner_text(self.find("author")) \
                or inner_text(self.find("dc:creator"))
        else:  # atom
            nodes = self.findall("author")
            names = [name for name in [inner_text(n.find("name"))
                                       for n in nodes] if name]
            return ", ".join(names) or None


class TextParser(HTMLParser):

    @staticmethod
    def parse(html: str) -> str:
        parser = TextParser()
        parser.feed(html)
        return "".join(parser.data).strip()

    def __init__(self) -> None:
        super().__init__()
        self.data = []  # type: List[str]

    def handle_data(self, data: str) -> None:
        self.data.append(data)
