# RSS 2.0 specification
# https://www.rssboard.org/rss-specification

from datetime import datetime
from hashlib import md5
from typing import Optional, List
from xml.etree import ElementTree as ET

from rss_reader.parser.common import NS, ParserError, FeedType, Repr, \
    FeedParser, FeedItemParser, Enclosure, get_child_node_text, \
    get_child_node_content, format_author, find_children, get_node_text, \
    find_child, get_node_attr, get_link_href_attr, \
    raise_required_elm_missing_error, parse_date_str


class RSSParser(Repr, FeedParser["RSSItemParser"]):

    def __init__(self, node: ET.Element) -> None:
        channel_node = node.find("channel")
        if channel_node is None:
            raise_required_elm_missing_error("channel", "rss")
        self._node = channel_node

        title = get_child_node_text(self._node, "title")
        if title is None:
            raise_required_elm_missing_error("title", "channel")
        self._title = title

        web_url = get_child_node_text(self._node, "link")
        if web_url is None:
            raise_required_elm_missing_error("link", "channel")
        self._web_url = web_url

    @property
    def title(self) -> str:
        return self._title

    @property
    def web_url(self) -> str:
        return self._web_url

    @property
    def items(self) -> List["RSSItemParser"]:
        items: List["RSSItemParser"] = []
        for node in self._node.findall("item"):
            try:
                items.append(RSSItemParser(node))
            except Exception:
                pass  # TODO: log
        return items

    @property
    def feed_type(self) -> FeedType:
        return FeedType.RSS


class RSSItemParser(Repr, FeedItemParser):

    def __init__(self, node: ET.Element) -> None:
        self._node = node
        self._guid = self._get_guid()
        self._url = self._get_url()

    @property
    def guid(self) -> str:
        return self._guid

    @property
    def hash(self):
        return md5(ET.tostring(self._node)).hexdigest()

    @property
    def title(self) -> str:
        title = get_child_node_text(self._node, "title")

        if title is None:
            title = self.summary

        if title is None:
            title = "(no title)"

        return title

    @property
    def url(self) -> Optional[str]:
        return self._url

    @property
    def summary(self) -> Optional[str]:
        summary = get_child_node_text(self._node, "description")
        if summary is None:
            summary = get_child_node_text(self._node, "content:encoded")
        return summary

    @property
    def content(self) -> Optional[str]:
        content = get_child_node_content(self._node, "content:encoded")
        if content is None:
            content = get_child_node_content(self._node, "description")
        return content

    @property
    def comments_url(self) -> Optional[str]:
        return get_child_node_text(self._node, "comments")

    @property
    def author(self) -> Optional[str]:
        author = get_child_node_text(self._node, "author")
        dc_creator = get_child_node_text(self._node, "dc:creator")
        return format_author(dc_creator, author)

    @property
    def time_published(self) -> Optional[datetime]:
        date_str = get_child_node_text(self._node, "pubDate")

        if date_str is None:
            return None

        valid_formats = [
            "%a, %d %b %Y %H:%M:%S %z",
            "%a, %d %b %Y %H:%M:%S %Z"]

        return parse_date_str(date_str, valid_formats)

    @property
    def enclosures(self) -> List[Enclosure]:
        enclosures: List[Enclosure] = []
        for node in find_children(self._node, "enclosure"):
            try:
                enclosures.append(Enclosure(node))
            except Exception:
                pass  # TODO: log
        return enclosures

    @property
    def categories(self) -> List[str]:
        nodes = find_children(self._node, "category")
        values = [get_node_text(node) for node in nodes]
        return [item for item in values if item is not None]

    def _get_url(self) -> Optional[str]:
        value = get_child_node_text(self._node, "link")
        if value:
            return value

        guid_node = find_child(self._node, "guid")
        if guid_node is not None:
            if get_node_attr(guid_node, "isPermalink") == "true":
                value = get_node_text(guid_node)
        if value:
            return value

        value = get_link_href_attr(self._node, [None, "alternate"],
                                   tag_name=f"{{{ NS['atom'] }}}link")
        if value:
            return value

        return None

    def _get_guid(self) -> str:
        value = get_child_node_text(self._node, "guid")

        if value is None:
            value = self._get_url()

        if value is None:
            raise ParserError("Cannot parse item id.")

        return value