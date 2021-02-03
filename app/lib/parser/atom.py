# Atom format specification
# https://tools.ietf.org/html/rfc4287

from datetime import datetime
from hashlib import md5
from typing import List, Optional
from xml.etree import ElementTree as ET

from .common import FeedType, FeedParser, FeedItemParser, \
    Repr, Enclosure, raise_required_elm_missing_error, find_children, \
    get_child_node_text, get_child_node_content, format_author, \
    get_link_href_attr, find_links_by_rel_attr, get_node_attr, parse_date_str


class AtomParser(Repr, FeedParser["AtomItemParser"]):

    def __init__(self, node: ET.Element) -> None:
        self._node = node

        title = get_child_node_text(node, "title")
        if title is None:
            raise_required_elm_missing_error("title", "feed")
        self._title = title

        web_url = get_link_href_attr(self._node, [None, "alternate"])
        if web_url is None:
            raise_required_elm_missing_error("link", "feed")
        self._web_url = web_url

    @property
    def title(self) -> str:
        return self._title

    @property
    def web_url(self) -> str:
        return self._web_url

    @property
    def items(self) -> List["AtomItemParser"]:
        items: List[AtomItemParser] = []
        for node in self._node.findall("entry"):
            try:
                items.append(AtomItemParser(node))
            except Exception:
                pass  # TODO: log
        return items

    @property
    def feed_type(self) -> FeedType:
        return FeedType.ATOM


class AtomItemParser(Repr, FeedItemParser):

    def __init__(self, node: ET.Element) -> None:
        self._node = node

        guid = get_child_node_text(node, "id")
        if guid is None:
            raise_required_elm_missing_error("id", "entry")
        self._guid = guid

        url = get_link_href_attr(self._node, [None, "alternate"])
        if url is None:
            raise_required_elm_missing_error("link", "entry")
        self._url = url

    @property
    def guid(self) -> str:
        return self._guid

    @property
    def hash(self):
        return md5(ET.tostring(self._node)).hexdigest()

    @property
    def url(self) -> str:
        return self._url

    @property
    def title(self) -> str:
        title = get_child_node_text(self._node, "title")
        return title if title else self.url

    @property
    def summary(self) -> Optional[str]:
        summary = get_child_node_text(self._node, "summary")

        if summary is None:
            summary = get_child_node_text(self._node, "content")

        return summary

    @property
    def content(self) -> Optional[str]:
        return get_child_node_content(self._node, "content")

    @property
    def comments_url(self) -> Optional[str]:
        comments_url = get_child_node_text(self._node, "comments")

        if comments_url is None:
            comments_url = get_link_href_attr(self._node, ["replies"])

        return comments_url

    @property
    def author(self) -> Optional[str]:
        authors = []

        for author_node in find_children(self._node, "author"):
            name = get_child_node_text(author_node, "name")
            email = get_child_node_text(author_node, "email")
            author = format_author(name, email)

            if author is not None:
                authors.append(author)

        return None if len(authors) == 0 else ", ".join(authors)

    @property
    def time_published(self) -> Optional[datetime]:
        date_str = get_child_node_text(self._node, "published")

        if not date_str:
            return None

        valid_formats = [
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S.%f%z"]

        return parse_date_str(date_str, valid_formats)

    @property
    def enclosures(self) -> List[Enclosure]:
        enclosures: List[Enclosure] = []
        for node in find_links_by_rel_attr(self._node, ["enclosure"]):
            try:
                enclosures.append(Enclosure(node))
            except Exception:
                pass  # TODO: log
        return enclosures

    @property
    def categories(self) -> List[str]:
        nodes = find_children(self._node, "category")
        values = [get_node_attr(node, "term") for node in nodes]
        return [item for item in values if item is not None]
