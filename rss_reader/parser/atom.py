from typing import List, Optional
from xml.etree import ElementTree as ET

from rss_reader.parser.common import FeedType, FeedParser, FeedItemParser, \
    Enclosure, raise_required_elm_missing_error, find_children, \
    get_child_node_text, get_child_node_content, format_author, \
    get_link_href_attr, find_links_by_rel_attr, get_node_attr


class AtomParser(FeedParser["AtomItemParser"]):

    def __init__(self, node: ET.Element) -> None:
        self._node = node

        title = get_child_node_text(node, "title")
        if title is None:
            raise_required_elm_missing_error("title", "feed")
        self._title = title

        link = get_link_href_attr(self._node, [None, "alternate"])
        if link is None:
            raise_required_elm_missing_error("link", "entry")
        self._link = link

    @property
    def title(self) -> str:
        return self._title

    @property
    def link(self) -> str:
        return self._link

    @property
    def items(self) -> List["AtomItemParser"]:
        nodes = self._node.findall("entry")
        items = []  # type List["AtomItemParser"]
        for node in nodes:
            try:
                items.append(AtomItemParser(node))
            except Exception:

                pass  # TODO: log
        return items

    @property
    def feed_type(self) -> FeedType:
        return FeedType.ATOM


class AtomItemParser(FeedItemParser):

    def __init__(self, node: ET.Element) -> None:
        self._node = node

        item_id = get_child_node_text(node, "id")
        if item_id is None:
            raise_required_elm_missing_error("id", "entry")
        self._id = item_id

        title = get_child_node_text(node, "title")
        if title is None:
            raise_required_elm_missing_error("title", "entry")
        self._title = title

        link = get_link_href_attr(self._node, [None, "alternate"])
        if link is None:
            raise_required_elm_missing_error("link", "entry")
        self._link = link

    @property
    def id(self) -> str:
        return self._id

    @property
    def title(self) -> str:
        return self._title

    @property
    def link(self) -> str:
        return self._link

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
    def comments_link(self) -> Optional[str]:
        comments_link = get_child_node_text(self._node, "comments")

        if comments_link is None:
            comments_link = get_link_href_attr(self._node, ["replies"])

        return comments_link

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
    def enclosures(self) -> List[Enclosure]:
        enclosures = []

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
