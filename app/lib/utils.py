from contextlib import contextmanager
from http.client import HTTPConnection, HTTPSConnection, HTTPResponse
from urllib.parse import urljoin, urlparse
from typing import Union, Iterator, Optional
from flask import current_app as app


def ensure_abs_url(base: str, url: str) -> str:
    return urljoin(base, url)


class HTTPResponseError(Exception):
    def __init__(self, res: HTTPResponse, message: Optional[str] = None):
        super().__init__(message)
        self.res = res


@contextmanager
def http_request(url: str, method: str = "GET") -> Iterator[HTTPResponse]:
    method = method.upper()
    app.logger.info(f"|> {method} {url}")

    url_parsed = urlparse(url)
    conn: Union[HTTPConnection, HTTPSConnection]

    if url_parsed.scheme == "https":
        conn = HTTPSConnection(url_parsed.netloc, timeout=3)
    else:
        conn = HTTPConnection(url_parsed.netloc, timeout=3)

    req_url = url_parsed.path
    if url_parsed.query:
        req_url += f"?{url_parsed.query}"

    try:
        conn.request(method, req_url, headers={
            "User-agent": "Mozilla/5.0 (+https://github.com/jirikuchta/rss-reader"})
    except Exception as e:
        app.logger.warn(f"|< {e}")
        raise e
    else:
        res = conn.getresponse()

        app.logger.info(f"|< {res.status} {res.reason}")

        if res.status >= 400:
            raise HTTPResponseError(res)

        if res.status in (301, 302):
            redir_url = res.headers.get("Location")
            app.logger.info(f"|> {redir_url}")
            with http_request(redir_url, method) as res:
                yield res
        else:
            yield res
    finally:
        conn.close()

    conn.close()
