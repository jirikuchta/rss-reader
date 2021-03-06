from html.parser import HTMLParser
from typing import TypedDict, List, Tuple, Optional

from lib.utils import ensure_abs_url


class FeedLink(TypedDict):
    href: str
    title: Optional[str]


class FeedLinkParser(HTMLParser):

    def __init__(self, html: str, base_url: str) -> None:
        super().__init__()
        self._base_url = base_url
        self._links: List[FeedLink] = []
        self.feed(html)

    @property
    def links(self) -> List[FeedLink]:
        return self._links

    def handle_starttag(self, tag: str,
                        attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag != "link":
            return

        attrs_dict = {k: v for k, v in attrs}
        type = attrs_dict.get("type")
        href = attrs_dict.get("href")

        if href and type in ("application/rss+xml", "application/atom+xml"):
            self._links.append({
                "href": ensure_abs_url(self._base_url, href),
                "title": attrs_dict.get("title")})


class Favicon(TypedDict):
    href: str
    size: Optional[int]


class FaviconParser(HTMLParser):

    def __init__(self, html: str, base_url: str) -> None:
        super().__init__()
        self._base_url = base_url
        self._icons: List[Favicon] = []
        self.feed(html)

    @property
    def icons(self) -> List[Favicon]:
        return self._icons

    def handle_starttag(self, tag: str,
                        attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag != "link":
            return

        attrs_dict = {k: v for k, v in attrs}
        rel = attrs_dict.get("rel")
        href = attrs_dict.get("href")

        if href and rel and "icon" in rel.split(" "):
            size = attrs_dict.get("sizes")
            self._icons.append({
                "href": ensure_abs_url(self._base_url, href),
                "size": int(size.split("x")[0]) if size else None})


class TextParser(HTMLParser):

    @staticmethod
    def parse(html: str) -> str:
        parser = TextParser()
        parser.feed(f"<div>{html}</div>")
        return "".join(parser.data).strip()

    def __init__(self) -> None:
        super().__init__()
        self.data = []  # type: List[str]

    def handle_data(self, data: str) -> None:
        self.data.append(data)
