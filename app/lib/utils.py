from html.parser import HTMLParser
from http.client import HTTPResponse
from typing import TypedDict, List, Tuple, Optional
from urllib.parse import urljoin
from urllib import request as req


def ensure_abs_url(base: str, url: str) -> str:
    return urljoin(base, url)


def request(url: str) -> HTTPResponse:
    return req.urlopen(req.Request(url, headers={"User-agent": "RSS reader"}))


class IconLink(TypedDict):
    href: str
    size: Optional[int]


class FeedLink(TypedDict):
    href: str
    title: Optional[str]


class LinkParser(HTMLParser):

    def __init__(self, html: str) -> None:
        super().__init__()

        self._icons: List[IconLink] = []
        self._feeds: List[FeedLink] = []

        self.feed(html)

    @property
    def icons(self) -> List[IconLink]:
        return self._icons

    @property
    def feeds(self) -> List[FeedLink]:
        return self._feeds

    def handle_starttag(self, tag: str,
                        attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag != "link":
            return

        attrs_dict = {k: v for k, v in attrs}
        rel = attrs_dict.get("rel")
        type = attrs_dict.get("type")
        href = attrs_dict.get("href")

        if href and rel and "icon" in rel.split(" "):
            size = attrs_dict.get("sizes")
            self._icons.append({
                "href": href,
                "size": int(size.split("x")[0]) if size else None})

        if href and type in ("application/rss+xml", "application/atom+xml"):
            self._feeds.append({
                "href": href,
                "title": attrs_dict.get("title")})
