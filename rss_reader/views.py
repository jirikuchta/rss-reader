from io import BytesIO
from urllib import request
from flask import Flask, Blueprint, render_template, Response, abort

from rss_reader.logger import before_request, after_request
from rss_reader.models import Subscription
from rss_reader.parser import parse_web_favicon_url


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
    icon = None
    subscription = Subscription.query.get(subscription_id)
    web_url = subscription.web_url.strip("/")

    if not subscription:
        abort(404)

    try:
        with request.urlopen(f"{web_url}/favicon.ico") as res:
            icon = res.read()
    except Exception:
        try:
            icon_url = parse_web_favicon_url(web_url)
            if icon_url:
                with request.urlopen(icon_url) as res:
                    icon = res.read()
        except Exception:
            pass
    finally:
        if not icon:
            abort(404)

        res = Response(BytesIO(icon), mimetype="image/x-icon")
        # res.cache_control.max_age = 300
        # res.cache_control.public = True

        return res
