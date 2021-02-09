from base64 import b64decode
from io import BytesIO
from typing import List, Tuple, Optional
from html.parser import HTMLParser

from flask import Response

from models import Subscription
from lib.utils import ensure_abs_url, request

# 1px transparent GIF
DEFAULT = b64decode(
    "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==")


def fetch(subscription: Subscription) -> Response:
    if subscription.web_url is None:
        return Response(BytesIO(DEFAULT), mimetype="image/x-icon")

    icon = DEFAULT
    web_url = subscription.web_url

    try:
        with request(ensure_abs_url(web_url, "favicon.ico")) as res:
            icon = res.read()
    except Exception:
        try:
            with request(web_url) as response:
                charset = response.headers.get_content_charset("utf-8")
                html = response.read().decode(charset)

            icon_url = FaviconParser.parse(html)

            if icon_url:
                icon_url = ensure_abs_url(web_url, icon_url)
                with request(icon_url) as res:
                    icon = res.read()
        except Exception:
            pass

    return Response(BytesIO(icon), mimetype="image/x-icon")


class FaviconParser(HTMLParser):

    @staticmethod
    def parse(html: str) -> Optional[str]:
        parser = FaviconParser()
        parser.feed(html)
        return parser.icon_href

    def __init__(self) -> None:
        super().__init__()
        self._icon_href: Optional[str] = None

    @property
    def icon_href(self) -> Optional[str]:
        return self._icon_href

    def handle_starttag(
            self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        if self._is_icon_link(tag, attrs):
            href, size = None, None
            for k, v in attrs:
                if k == "href" and v:
                    href = v
                if k == "sizes" and v:
                    size = int(v.split("x")[0])

            if href and (not self._icon_href or size == 16):
                self._icon_href = href.strip()

    def _is_icon_link(self, tag: str, attrs: List[Tuple[str, Optional[str]]]):
        if tag == "link":
            for k, v in attrs:
                if k == "rel" and v and "icon" in v.split(" "):
                    return True
