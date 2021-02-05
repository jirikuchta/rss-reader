from typing import Optional
from xml.etree import ElementTree as ET

from flask import current_app as app

from lib.utils import ensure_abs_url, request
from lib.parser.common import FeedParser, FeedItemParser  # noqa: F401
from lib.parser.favicon import FaviconParser  # noqa: F401
from lib.parser.atom import AtomParser
from lib.parser.rss import RSSParser


def parse(feed_url: str) -> FeedParser:
    with request(feed_url) as response:
        content = response.read()

    root = ET.fromstring(content)

    if root.tag == "rss":
        return RSSParser(root, feed_url)
    else:
        return AtomParser(root, feed_url)


def parse_web_favicon_url(web_url: str) -> Optional[str]:
    with request(web_url) as response:
        charset = response.headers.get_content_charset("utf-8")
        html = response.read().decode(charset)

    icon_url = FaviconParser.parse(html)

    app.logger.info(icon_url)

    if icon_url:
        icon_url = ensure_abs_url(web_url, icon_url)

    app.logger.info(icon_url)

    return icon_url
