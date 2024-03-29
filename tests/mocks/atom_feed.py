from typing import List, Union
from xml.etree import ElementTree as ET

from lib.feedparser import NS


class MockAtomFeed:

    def __init__(
            self,
            title: str = None,
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

    def __init__(
            self,
            item_id: str = None,
            link: "MockAtomLink" = None,
            title: str = None,
            summary: str = None,
            content: str = None,
            comments: Union["MockAtomLink", str] = None,
            image: "MockAtomLink" = None,
            author: "MockAtomAuthor" = None,
            published: str = None) -> None:
        self.item_id = item_id
        self.title = title
        self.link = link
        self.summary = summary
        self.content = content
        self.comments = comments
        self.image = image
        self.author = author
        self.published = published

    def build(self) -> ET.Element:
        root = ET.Element("entry")

        if self.item_id is not None:
            id_node = ET.SubElement(root, "id")
            id_node.text = self.item_id

        if self.title is not None:
            title = ET.SubElement(root, "title")
            title.text = self.title

        if self.summary is not None:
            summary = ET.SubElement(root, "summary")
            summary.text = self.summary

        if self.content is not None:
            content = ET.SubElement(root, "content")
            content.text = self.content

        if self.author is not None:
            root.append(self.author.build())

        if self.published is not None:
            published = ET.SubElement(root, "published")
            published.text = self.published

        if self.link is not None:
            root.append(self.link.build())

        if self.comments is not None:
            if isinstance(self.comments, MockAtomLink):
                root.append(self.comments.build())
            else:
                comments = ET.SubElement(root, "comments")
                comments.text = self.comments

        if self.image is not None:
            root.append(self.image.build())

        return root


class MockAtomLink:
    def __init__(
            self,
            href: str = None,
            rel: str = None,
            type_attr: str = None,
            length: int = None) -> None:
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
            name: str = None,
            email: str = None) -> None:
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
