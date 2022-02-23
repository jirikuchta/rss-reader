from base64 import b64decode
from io import BytesIO

from flask import current_app as app, Response

from models import Subscription
from lib.utils import ensure_abs_url, http_request
from lib.htmlparser import FaviconParser

# 1px transparent GIF
DEFAULT = b64decode(
    "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==")


def fetch(subscription: Subscription) -> Response:
    icon = None
    mime = None

    web_url = subscription.web_url
    if web_url is None:
        web_url = ensure_abs_url(subscription.feed_url, "/")

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
                mime = res.headers.get_content_type()
    except Exception as e:
        app.logger.warn(e)

    if icon is None:
        try:
            with http_request(ensure_abs_url(web_url, "/favicon.ico")) as res:
                icon = res.read()
                mime = "image/x-icon"
        except Exception as e:
            app.logger.warn(e)

    return Response(
        BytesIO(icon or DEFAULT),
        mimetype=mime or "image/gif"
    )
