from typing import Optional, List
from xml.etree import ElementTree as ET

from parser.common import NS


class MockAtomFeed:

    def __init__(
            self,
            title: Optional[str],
            links: List["MockAtomLink"] = None,
            items: List["MockAtomFeedItem"] = None) -> None:
        self.title = title
        self.links = [] if links is None else links
        self.items = [] if items is None else items

    def build(self) -> ET.Element:
        root = ET.Element("feed")

        if self.title is not None:
            title = ET.SubElement(root, "title")
            title.text = self.title

        for link in self.links:
            root.append(link.build())

        for item in self.items:
            root.append(item.build())

        return root


class MockAtomFeedItem:

    def build(self) -> ET.Element:
        return ET.Element("entry")


class MockAtomLink:
    def __init__(self,
                 href: Optional[str],
                 rel: Optional[str] = None,
                 type_attr: Optional[str] = None,
                 length: Optional[int] = None) -> None:
        self.href = href
        self.rel = rel
        self.type = type_attr
        self.length = length

    def build(self) -> ET.Element:
        attrib = {}

        if self.href is not None:
            attrib["href"] = self.href

        if self.rel is not None:
            attrib["rel"] = self.rel

        if self.type is not None:
            attrib["type"] = self.type

        if self.length is not None:
            attrib["length"] = str(self.length)

        return ET.Element(f"{{{ NS['atom'] }}}link", attrib=attrib)
