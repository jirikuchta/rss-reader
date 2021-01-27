import urllib.request
from typing import Optional
from xml.etree import ElementTree as ET

from rss_reader.parser.common import FeedParser, FeedItemParser  # noqa: F401
from rss_reader.parser.favicon import FaviconParser  # noqa: F401
from rss_reader.parser.atom import AtomParser
from rss_reader.parser.rss import RSSParser


def parse(feed_url: str) -> FeedParser:
    with urllib.request.urlopen(feed_url) as response:
        content = response.read()

    root = ET.fromstring(content)

    if root.tag == "rss":
        return RSSParser(root)
    else:
        return AtomParser(root)


def parse_web_favicon_url(web_url: str) -> Optional[str]:
    with urllib.request.urlopen(web_url) as response:
        charset = response.headers.get_content_charset("utf-8")
        html = response.read().decode(charset)

    return FaviconParser.parse(html)
