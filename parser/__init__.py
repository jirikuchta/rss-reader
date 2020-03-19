import urllib.request
from typing import Dict, Any
from xml.etree import ElementTree as ET

from rss_reader.parser.common import FeedParser
from rss_reader.parser.atom import AtomParser
from rss_reader.parser.rss import RSSParser


def parse(uri: str) -> FeedParser:
    with urllib.request.urlopen(uri) as response:
        content = response.read()

    root = ET.fromstring(content)

    if root.tag == "rss":
        return RSSParser(root)
    else:
        return AtomParser(root)
