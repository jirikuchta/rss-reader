from typing import Optional, List, NoReturn
from xml.etree import ElementTree as ET

from .common import ParserError, FeedType, FeedParser, FeedItemParser, \
    Enclosure, get_child_node_text, get_child_node_content, find_children, \
    get_node_text, find_child, get_node_attr


def raise_required_elm_missing_error(elm: str, parent: str) -> NoReturn:
    raise ParserError(f"Missing required <{elm}> sub-element of <{parent}>.")


class RSSParser(FeedParser["RSSItemParser"]):

    def __init__(self, node: ET.Element) -> None:
        channel_node = node.find("channel")
        if channel_node is None:
            raise_required_elm_missing_error("channel", "rss")
        self._node = channel_node

        title = get_child_node_text(self._node, "title")
        if title is None:
            raise_required_elm_missing_error("title", "channel")
        self._title = title

        link = get_child_node_text(self._node, "link")
        if link is None:
            raise_required_elm_missing_error("link", "channel")
        self._link = link

    @property
    def title(self) -> str:
        return self._title

    @property
    def link(self) -> str:
        return self._link

    @property
    def items(self) -> List["RSSItemParser"]:
        item_nodes = self._node.findall("item")
        items = []  # type List["RSSItemParser"]
        for item_node in item_nodes:
            try:
                items.append(RSSItemParser(item_node))
            except Exception:
                pass  # TODO: log
        return items

    @property
    def feed_type(self) -> FeedType:
        return FeedType.RSS


class RSSItemParser(FeedItemParser):

    def __init__(self, node: ET.Element) -> None:
        self._node = node
        self._link = self._get_link()
        self._title = self._get_title()
        self._id = self._get_id()

        guid = get_child_node_text(node, "guid")
        self._id = self.link if guid is None else guid

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
    def description(self) -> Optional[str]:
        description = get_child_node_text(self._node, "description")
        if description is None:
            description = get_child_node_text(self._node, "content:encoded")
        return description

    @property
    def content(self) -> Optional[str]:
        content = get_child_node_content(self._node, "content:encoded")
        if content is None:
            content = get_child_node_content(self._node, "description")
        return content

    @property
    def comments_link(self) -> Optional[str]:
        return get_child_node_text(self._node, "comments")

    @property
    def author(self) -> Optional[str]:
        author = get_child_node_text(self._node, "author")
        dc_creator = get_child_node_text(self._node, "dc:creator")
        if dc_creator is not None:
            if author is not None:
                author = f"{dc_creator} <{author}>"
            else:
                author = dc_creator
        return author

    @property
    def enclosures(self) -> List[Enclosure]:
        nodes = find_children(self._node, "enclosure")
        enclosures = []  # type: List[Enclosure]

        for node in nodes:
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

    def _get_link(self) -> str:
        link = get_child_node_text(self._node, "link")
        if link is not None:
            return link

        guid_node = find_child(self._node, "guid")
        if guid_node is not None:
            if get_node_attr(guid_node, "isPermalink") == "true":
                link = get_node_text(guid_node)
                if link is not None:
                    return link

        atom_link_nodes = find_children(self._node, "atom:link")
        for atom_link_node in atom_link_nodes:
            href_attr = get_node_attr(atom_link_node, "href")
            rel_attr = get_node_attr(atom_link_node, "rel")

            if href_attr is None:
                continue

            if rel_attr in (None, "alternate", "standout"):
                return href_attr

        raise ParserError("Cannot parse item link.")

    def _get_title(self) -> str:
        title = get_child_node_text(self._node, "title")

        if title is None:
            title = get_child_node_text(self._node, "description")

        if title is None:
            title = get_child_node_text(self._node, "content:encoded")

        if title is None:
            raise ParserError("Cannot parse item title.")

        return title

    def _get_id(self) -> str:
        value = get_child_node_text(self._node, "guid")

        if value is None:
            value = self.link

        if value is None:
            raise ParserError("Cannot parse item id.")

        return value
