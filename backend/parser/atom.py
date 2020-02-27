from typing import List, Optional
from xml.etree import ElementTree as ET

from .common import FeedType, FeedParser, FeedItemParser, Enclosure, \
    raise_required_elm_missing_error, find_children, get_node_attr, \
    get_child_node_text


class AtomParser(FeedParser["AtomItemParser"]):

    def __init__(self, node: ET.Element) -> None:
        self._node = node

        self._title = self._get_title()
        self._link = self._get_link()

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

    def _get_title(self) -> str:
        title = get_child_node_text(self._node, "title")

        if title is None:
            raise_required_elm_missing_error("title", "atom:feed")

        return title

    def _get_link(self) -> str:
        link = None

        for atom_link_node in find_children(self._node, "atom:link"):
            href_attr = get_node_attr(atom_link_node, "href")
            rel_attr = get_node_attr(atom_link_node, "rel")

            if href_attr is None:
                continue

            if rel_attr in (None, "alternate"):
                link = href_attr
                break

        if link is None:
            raise_required_elm_missing_error("atom:link[rel=alternate]",
                                             "atom:feed")

        return link


class AtomItemParser(FeedItemParser):

    def __init__(self, node: ET.Element) -> None:
        self._node = node

    @property
    def id(self) -> str:
        return "id"

    @property
    def title(self) -> str:
        return "title"

    @property
    def link(self) -> str:
        return "link"

    @property
    def description(self) -> Optional[str]:
        return None

    @property
    def content(self) -> Optional[str]:
        return None

    @property
    def comments_link(self) -> Optional[str]:
        return None

    @property
    def author(self) -> Optional[str]:
        return None

    @property
    def enclosures(self) -> List[Enclosure]:
        return []

    @property
    def categories(self) -> List[str]:
        return []
