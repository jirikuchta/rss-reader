from typing import List
from xml.etree import ElementTree as ET

from lib.feedparser import NS
from tests.mocks.atom_feed import MockAtomLink


class MockRSSFeed:

    def __init__(
            self,
            title: str = None,
            link: str = None,
            items: List["MockRSSFeedItem"] = None,
            channel: bool = True) -> None:
        self.title = title
        self.link = link
        self.channel = channel
        self.items = [] if items is None else items

    def build(self) -> ET.Element:
        root = ET.Element("rss", attrib={"version": "2.0"})

        if self.channel is False:
            return root

        channel = ET.SubElement(root, "channel")

        if self.title is not None:
            title = ET.SubElement(channel, "title")
            title.text = self.title

        if self.link is not None:
            link = ET.SubElement(channel, "link")
            link.text = self.link

        for item in self.items:
            channel.append(item.build())

        return root


class MockRSSFeedItem:

    def __init__(
            self,
            link: str = None,
            guid: "MockRSSFeedItemGUID" = None,
            title: str = None,
            description: str = None,
            content_encoded: str = None,
            comments: str = None,
            enclosure: "MockRSSFeedItemEnclosure" = None,
            media: "MockRSSFeedItemMedia" = None,
            author: str = None,
            pubdate: str = None,
            dc_creator: str = None,
            atom_links: List[MockAtomLink] = None) -> None:
        self.title = title
        self.link = link
        self.guid = guid
        self.description = description
        self.content_encoded = content_encoded
        self.comments = comments
        self.enclosure = enclosure
        self.media = media
        self.author = author
        self.pubdate = pubdate
        self.dc_creator = dc_creator
        self.atom_links = [] if atom_links is None else atom_links

    def build(self) -> ET.Element:
        root = ET.Element("item")

        if self.guid is not None:
            root.append(self.guid.build())

        if self.title is not None:
            title = ET.SubElement(root, "title")
            title.text = self.title

        if self.link is not None:
            link = ET.SubElement(root, "link")
            link.text = self.link

        if self.description is not None:
            description = ET.SubElement(root, "description")
            description.text = self.description

        if self.content_encoded is not None:
            content_encoded = ET.SubElement(
                root, f"{{{ NS['content'] }}}encoded")
            content_encoded.text = self.content_encoded

        if self.comments is not None:
            comments = ET.SubElement(root, "comments")
            comments.text = self.comments

        if self.enclosure is not None:
            root.append(self.enclosure.build())

        if self.media is not None:
            root.append(self.media.build())

        if self.author is not None:
            author = ET.SubElement(root, "author")
            author.text = self.author

        if self.pubdate is not None:
            pubdate = ET.SubElement(root, "pubDate")
            pubdate.text = self.pubdate

        if self.dc_creator is not None:
            dc_creator = ET.SubElement(root, f"{{{ NS['dc'] }}}creator")
            dc_creator.text = self.dc_creator

        for atom_link in self.atom_links:
            root.append(atom_link.build(use_prefix=True))

        return root


class MockRSSFeedItemEnclosure:

    def __init__(
            self,
            url: str,
            type_attr: str,
            length: int = None) -> None:
        self.url = url
        self.type = type_attr
        self.length = length

    def build(self) -> ET.Element:
        attrib = {}

        if self.url is not None:
            attrib["url"] = self.url

        if self.type is not None:
            attrib["type"] = self.type

        if self.length is not None:
            attrib["length"] = str(self.length)

        return ET.Element("enclosure", attrib=attrib)


class MockRSSFeedItemMedia:

    def __init__(
            self,
            url: str,
            type_attr: str,
            group: bool = True) -> None:
        self.url = url
        self.type = type_attr
        self.group = group

    def build(self) -> ET.Element:
        attrib = {}

        if self.url is not None:
            attrib["url"] = self.url

        if self.type is not None:
            attrib["type"] = self.type

        elm = ET.Element(f"{{{ NS['media'] }}}content", attrib=attrib)

        if self.group is True:
            group = ET.Element(f"{{{ NS['media'] }}}group")
            group.append(elm)
            return group

        return elm


class MockRSSFeedItemGUID:

    def __init__(self, value: str = None, isPermalink: bool = False):
        self.value = value
        self.isPermalink = isPermalink

    def build(self) -> ET.Element:
        attrib = {}
        if self.isPermalink is True:
            attrib["isPermalink"] = "true"

        node = ET.Element("guid", attrib=attrib)

        if self.value is not None:
            node.text = self.value

        return node
