from flask import Flask, Blueprint, render_template, abort, Response

from models import Subscription
from lib.logger import before_request, after_request
from lib.feedicon import fetch as fetch_feed_icon


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
    subscription = Subscription.query.get(subscription_id)

    if not subscription:
        abort(404)

    return fetch_feed_icon(subscription)
