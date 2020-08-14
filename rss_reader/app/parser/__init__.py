import urllib.request
from xml.etree import ElementTree as ET

from rss_reader.app.parser.common import FeedParser
from rss_reader.app.parser.atom import AtomParser
from rss_reader.app.parser.rss import RSSParser


def parse(uri: str) -> FeedParser:
    with urllib.request.urlopen(uri) as response:
        content = response.read()

    root = ET.fromstring(content)

    if root.tag == "rss":
        return RSSParser(root)
    else:
        return AtomParser(root)
