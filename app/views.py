from base64 import b64decode
from io import BytesIO
from flask import Flask, Blueprint, render_template, abort, Response

from models import Subscription
from lib.logger import before_request, after_request
from lib.parser import parse_web_favicon_url
from lib.utils import request


views = Blueprint("views", __name__)


def init(app: Flask) -> None:
    views.before_request(before_request)
    views.after_request(after_request)

    app.register_blueprint(views)


@views.route("/")
def index() -> str:
    return render_template("index.html")


@views.route("/feed-icon/<int:subscription_id>/")
def feed_icon(subscription_id: int) -> Response:
    # 1px transparent GIF as default
    icon = b64decode(
        "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==")

    subscription = Subscription.query.get(subscription_id)

    if not subscription:
        abort(404)

    web_url = subscription.web_url.strip("/")

    try:
        with request(f"{web_url}/favicon.ico") as res:
            icon = res.read()
    except Exception:
        try:
            icon_url = parse_web_favicon_url(web_url)
            if icon_url:
                with request(icon_url) as res:
                    icon = res.read()
        except Exception:
            pass

    return Response(BytesIO(icon), mimetype="image/x-icon")
