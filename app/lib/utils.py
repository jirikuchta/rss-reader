from contextlib import contextmanager
from http.client import HTTPConnection, HTTPSConnection, HTTPResponse
from urllib.parse import urljoin, urlparse
from typing import Union, Iterator
from flask import current_app as app


def ensure_abs_url(base: str, url: str) -> str:
    return urljoin(base, url)


@contextmanager
def request(url: str, method: str = "GET") -> Iterator[HTTPResponse]:
    app.logger.info("Sending HTTP %s request to %s", method, url)

    url_parsed = urlparse(url)
    conn: Union[HTTPConnection, HTTPSConnection]

    if url_parsed.scheme == "https":
        conn = HTTPSConnection(url_parsed.netloc)
    else:
        conn = HTTPConnection(url_parsed.netloc)

    req_url = url_parsed.path
    if url_parsed.query:
        req_url += f"?{url_parsed.query}"

    conn.request(method.upper(), req_url,
                 headers={"User-agent": "RSS reader"})

    res = conn.getresponse()

    app.logger.info("Got HTTP response from %s, status=%s", url, res.status)

    if res.status in (301, 302):
        redir_url = res.headers.get("Location")
        app.logger.info("Following HTTP redirect %s -> %s", url, redir_url)
        with request(redir_url, method) as res:
            yield res
    else:
        yield res

    conn.close()
