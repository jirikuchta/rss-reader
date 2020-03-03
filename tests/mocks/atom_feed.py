from typing import Optional, List, Union
from xml.etree import ElementTree as ET

from backend.parser.common import NS


class MockAtomFeed:

    def __init__(
            self,
            title: Optional[str],
            link: Optional["MockAtomLink"] = None,
            items: List["MockAtomFeedItem"] = None) -> None:
        self.title = title
        self.link = link
        self.items = [] if items is None else items

    def build(self) -> ET.Element:
        root = ET.Element("feed")

        if self.title is not None:
            title = ET.SubElement(root, "title")
            title.text = self.title

        if self.link is not None:
            root.append(self.link.build())

        for item in self.items:
            root.append(item.build())

        return root


class MockAtomFeedItem:

    def __init__(
            self,
            item_id: Optional[str],
            title: Optional[str],
            link: Optional["MockAtomLink"],
            summary: Optional[str] = None,
            content: Optional[str] = None,
            comments: Optional[Union["MockAtomLink", str]] = None,
            author: Optional["MockAtomAuthor"] = None,
            enclosures: Optional[List["MockAtomLink"]] = None,
            categories: Optional[List[str]] = None) -> None:
        self.item_id = item_id
        self.title = title
        self.link = link
        self.summary = summary
        self.content = content
        self.comments = comments
        self.author = author
        self.enclosures = [] if enclosures is None else enclosures
        self.categories = [] if categories is None else categories

    def build(self) -> ET.Element:
        root = ET.Element("entry")

        if self.item_id is not None:
            id_node = ET.SubElement(root, "id")
            id_node.text = self.item_id

        if self.title is not None:
            title_node = ET.SubElement(root, "title")
            title_node.text = self.title

        if self.summary is not None:
            summary_node = ET.SubElement(root, "summary")
            summary_node.text = self.summary

        if self.content is not None:
            content_node = ET.SubElement(root, "content")
            content_node.text = self.content

        if self.author is not None:
            root.append(self.author.build())

        if self.link is not None:
            root.append(self.link.build())

        if self.comments is not None:
            if isinstance(self.comments, MockAtomLink):
                root.append(self.comments.build())
            else:
                comments_node = ET.SubElement(root, "comments")
                comments_node.text = self.comments

        for enclosure in self.enclosures:
            root.append(enclosure.build())

        for category in self.categories:
            category_attrib = {"term": category}
            ET.SubElement(root, "category", attrib=category_attrib)

        return root


class MockAtomLink:
    def __init__(
            self,
            href: Optional[str],
            rel: Optional[str] = None,
            type_attr: Optional[str] = None,
            length: Optional[int] = None) -> None:
        self.href = href
        self.rel = rel
        self.type = type_attr
        self.length = length

    def build(self, use_prefix: bool = False) -> ET.Element:
        attrib = {}

        if self.href is not None:
            attrib["href"] = self.href

        if self.rel is not None:
            attrib["rel"] = self.rel

        if self.type is not None:
            attrib["type"] = self.type

        if self.length is not None:
            attrib["length"] = str(self.length)

        tag_name = "link"
        if use_prefix is True:
            tag_name = f"{{{ NS['atom'] }}}{tag_name}"

        return ET.Element(tag_name, attrib=attrib)


class MockAtomAuthor:
    def __init__(
            self,
            name: Optional[str] = None,
            email: Optional[str] = None) -> None:
        self.name = name
        self.email = email

    def build(self) -> ET.Element:
        root = ET.Element("author")

        if self.name is not None:
            name = ET.SubElement(root, "name")
            name.text = self.name

        if self.email is not None:
            email = ET.SubElement(root, "email")
            email.text = self.email

        return root
