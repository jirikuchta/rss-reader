from base64 import b64decode
from io import BytesIO

from flask import Response

from models import Subscription
from lib.utils import ensure_abs_url, http_request
from lib.htmlparser import FaviconParser

# 1px transparent GIF
DEFAULT = b64decode(
    "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==")


def fetch(subscription: Subscription) -> Response:
    icon = DEFAULT
    web_url = subscription.web_url

    if web_url is None:
        return Response(BytesIO(icon), mimetype="image/x-icon")

    try:
        with http_request(ensure_abs_url(web_url, "favicon.ico")) as res:
            icon = res.read()
    except Exception:
        try:
            with http_request(web_url) as response:
                charset = response.headers.get_content_charset("utf-8")
                html = response.read().decode(charset)

            parser = FaviconParser(html, web_url)

            if len(parser.icons):
                icon_url = next(filter(
                    lambda i: i["size"] == 16, parser.icons),
                    parser.icons[0])["href"]
                with http_request(icon_url) as res:
                    icon = res.read()
        except Exception:
            pass

    return Response(BytesIO(icon), mimetype="image/x-icon")
