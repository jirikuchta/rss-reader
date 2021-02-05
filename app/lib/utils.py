from urllib.parse import urljoin
from urllib import request as req


def ensure_abs_url(base: str, url: str) -> str:
    return urljoin(base, url)


def request(url: str):
    return req.urlopen(req.Request(url, headers={"User-agent": "RSS reader"}))
