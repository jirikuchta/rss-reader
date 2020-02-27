from abc import ABC
from datetime import datetime
from enum import Enum
from html.parser import HTMLParser
from typing import Optional, List, TypeVar, Generic
from xml.etree import ElementTree as ET


NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "dc": "http://purl.org/dc/elements/1.1/",
    "content": "http://purl.org/rss/1.0/modules/content/"
}


class ParserError(Exception):
    pass


class FeedType(Enum):
    RSS = 1
    ATOM = 2


TFeedItemParser = TypeVar("TFeedItemParser", bound="FeedItemParser")


class FeedParser(ABC, Generic[TFeedItemParser]):

    @property
    def title(self) -> str:
        pass

    @property
    def link(self) -> str:
        pass

    @property
    def description(self) -> str:
        pass

    @property
    def items(self) -> List[TFeedItemParser]:
        pass

    @property
    def feed_type(self) -> FeedType:
        pass


class FeedItemParser(ABC):

    @property
    def id(self) -> str:
        pass

    @property
    def title(self) -> str:
        pass

    @property
    def link(self) -> str:
        pass

    @property
    def date(self) -> Optional[datetime]:
        pass

    @property
    def description(self) -> Optional[str]:
        pass

    @property
    def content(self) -> Optional[str]:
        pass

    @property
    def comments_link(self) -> Optional[str]:
        pass

    @property
    def author(self) -> Optional[str]:
        pass

    @property
    def enclosures(self) -> Optional[List["Enclosure"]]:
        pass

    @property
    def categories(self) -> Optional[List[str]]:
        pass


class Enclosure:

    def __init__(self, node: ET.Element) -> None:
        self._node = node
        self._url = node.attrib["url"].strip()
        self._type = node.attrib["type"].strip()

    @property
    def url(self) -> str:
        return self._url

    @property
    def type(self) -> str:
        return self._type

    @property
    def length(self) -> Optional[int]:
        length = self._node.attrib.get("length")
        return int(length) if length else None


class MLParser(HTMLParser):

    @staticmethod
    def to_text(html: str) -> str:
        parser = MLParser()
        parser.feed(html)
        return "".join(parser.data).strip()

    def __init__(self) -> None:
        super().__init__()
        self.data = []  # type: List[str]

    def handle_data(self, data: str) -> None:
        self.data.append(data)


def find_children(node: ET.Element, tag_name: str) -> List[ET.Element]:
    return node.findall(tag_name, NS)


def find_child(node: ET.Element, tag_name: str) -> Optional[ET.Element]:
    return node.find(tag_name, NS)


def get_node_text(node: ET.Element) -> Optional[str]:
    return MLParser.to_text(node.text) if node.text is not None else None


def get_node_attr(node: ET.Element, attr: str,
                  lower: bool = True) -> Optional[str]:
    value = node.attrib.get(attr)

    if value is None:
        return value

    if lower is True:
        value = value.lower()

    return value.strip()


def get_child_node_content(node: ET.Element, tag_name: str) -> Optional[str]:
    child_node = find_child(node, tag_name)
    content = child_node.text if child_node is not None else None
    return content.strip() if content is not None else None


def get_child_node_text(node: ET.Element, tag_name: str) -> Optional[str]:
    child_node = find_child(node, tag_name)
    return get_node_text(child_node) if child_node is not None else None
