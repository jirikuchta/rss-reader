import logging
from abc import ABC
from datetime import datetime
from enum import Enum
from html.parser import HTMLParser
from typing import Optional, List, TypeVar, Generic, NoReturn, Union
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
    def web_url(self) -> str:
        pass

    @property
    def items(self) -> List[TFeedItemParser]:
        pass

    @property
    def feed_type(self) -> FeedType:
        pass

    @property
    def feed_url(self) -> Optional[str]:
        pass


class FeedItemParser(ABC):

    @property
    def guid(self) -> str:
        pass

    @property
    def hash(self) -> str:
        pass

    @property
    def title(self) -> str:
        pass

    @property
    def url(self) -> Optional[str]:
        pass

    @property
    def summary(self) -> Optional[str]:
        pass

    @property
    def content(self) -> Optional[str]:
        pass

    @property
    def comments_url(self) -> Optional[str]:
        pass

    @property
    def author(self) -> Optional[str]:
        pass

    @property
    def time_published(self) -> Optional[datetime]:
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

        url = get_node_attr(node, "href")
        if url is None:
            url = get_node_attr(node, "url")
        if url is None:
            raise ParserError("Failed to parser enclosure url.")
        self._url = url

        enc_type = get_node_attr(node, "type")
        if enc_type is None:
            raise ParserError("Failed to parser enclosure type.")
        self._type = enc_type

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
    def parse_text(html: str) -> str:
        parser = MLParser()
        parser.feed(html)
        return "".join(parser.data).strip()

    def __init__(self) -> None:
        super().__init__()
        self.data = []  # type: List[str]

    def handle_data(self, data: str) -> None:
        self.data.append(data)


def format_author(name: Optional[str], email: Optional[str]) -> Optional[str]:
    if name is not None and email is not None:
        return f"{name} <{email}>"

    if name is not None:
        return name

    if email is not None:
        return email

    return None


def find_children(parent: ET.Element, tag_name: str) -> List[ET.Element]:
    return parent.findall(tag_name, NS)


def find_child(parent: ET.Element, tag_name: str) -> Optional[ET.Element]:
    return parent.find(tag_name, NS)


def find_links_by_rel_attr(parent: ET.Element,
                           rel_values: List[Union[None, str]],
                           tag_name: Optional[str] = None) -> List[ET.Element]:
    nodes = find_children(parent, "link" if tag_name is None else tag_name)
    return list(filter(lambda x: get_node_attr(x, "rel") in rel_values, nodes))


def get_node_text(node: ET.Element) -> Optional[str]:
    parsed_text = MLParser.parse_text(node.text)
    return parsed_text if parsed_text else node.text


def get_node_attr(node: ET.Element, attr: str,
                  lower: bool = True) -> Optional[str]:
    value = node.attrib.get(attr)

    if value is None:
        return value

    if lower is True:
        value = value.lower()

    return value.strip()


def get_child_node_content(parent: ET.Element,
                           child_tag_name: str) -> Optional[str]:
    child_node = find_child(parent, child_tag_name)
    content = child_node.text if child_node is not None else None
    return content.strip() if content is not None else None


def get_child_node_text(parent: ET.Element,
                        child_tag_name: str) -> Optional[str]:
    child_node = find_child(parent, child_tag_name)
    return get_node_text(child_node) if child_node is not None else None


def get_link_href_attr(parent: ET.Element,
                       rel_values: List[Union[None, str]],
                       tag_name: Optional[str] = None) -> Optional[str]:
    nodes = find_links_by_rel_attr(parent, rel_values, tag_name=tag_name)
    if len(nodes) > 0:
        return get_node_attr(nodes[0], "href")
    return None


def raise_required_elm_missing_error(elm: str, parent: str) -> NoReturn:
    raise ParserError(f"Missing required <{elm}> sub-element of <{parent}>.")


def parse_date_str(date_str: str,
                   valid_formats: List[str]) -> Optional[datetime]:
    for date_format in valid_formats:
        try:
            return datetime.utcfromtimestamp(
                datetime.strptime(date_str, date_format).timestamp())
        except ValueError:
            pass
