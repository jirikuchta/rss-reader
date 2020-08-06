import urllib.request
from xml.etree import ElementTree as ET

from app.parser.common import FeedParser
from app.parser.atom import AtomParser
from app.parser.rss import RSSParser


def parse(uri: str) -> FeedParser:
    with urllib.request.urlopen(uri) as response:
        content = response.read()

    root = ET.fromstring(content)

    if root.tag == "rss":
        return RSSParser(root)
    else:
        return AtomParser(root)
