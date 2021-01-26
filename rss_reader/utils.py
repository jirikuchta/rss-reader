import os
from typing import List, Tuple, Optional
from urllib import request
from urllib.error import URLError
from html.parser import HTMLParser


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
        return False


def favicon(web_url: str) -> None:
    web_url = web_url.strip("/")

    try:
        file = request.urlopen(f"{web_url}/favicon.ico").read()
    except URLError:
        try:
            with request.urlopen(web_url) as response:
                charset = response.headers.get_content_charset("utf-8")
                html = response.read().decode(charset)

            icon_href = FaviconParser.parse(html)

            if not icon_href:
                return None

            if not icon_href.startswith("http"):
                icon_href = f"{web_url}/{icon_href.strip('/')}"

            file = request.urlopen(icon_href).read()

        except Exception:
            pass

    if file:
        print("===============================")
        with open(os.path.join("/rss_reader", "00000001.ico"), "wb") as f:
            f.write(file)
