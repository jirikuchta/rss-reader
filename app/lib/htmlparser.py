from html.parser import HTMLParser
from typing import TypedDict, List, Tuple, Optional


class FeedLink(TypedDict):
    href: str
    title: Optional[str]


class FeedLinkParser(HTMLParser):

    def __init__(self, html: str) -> None:
        super().__init__()
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
                "href": href,
                "title": attrs_dict.get("title")})


class Favicon(TypedDict):
    href: str
    size: Optional[int]


class FaviconParser(HTMLParser):

    def __init__(self, html: str) -> None:
        super().__init__()
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
                "href": href,
                "size": int(size.split("x")[0]) if size else None})
