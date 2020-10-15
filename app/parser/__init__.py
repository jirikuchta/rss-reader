import urllib.request
from xml.etree import ElementTree as ET

from app.parser.common import FeedParser, FeedItemParser  # noqa: F401
from app.parser.atom import AtomParser
from app.parser.rss import RSSParser


def parse(feed_url: str) -> FeedParser:
    with urllib.request.urlopen(feed_url) as response:
        content = response.read()

    root = ET.fromstring(content)

    if root.tag == "rss":
        return RSSParser(root)
    else:
        return AtomParser(root)
