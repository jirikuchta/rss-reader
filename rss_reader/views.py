from flask import Flask, Blueprint, render_template

from rss_reader.logger import before_request, after_request


views = Blueprint("views", __name__)


def init(app: Flask) -> None:
    views.before_request(before_request)
    views.after_request(after_request)

    app.register_blueprint(views)


@views.route("/")
def index() -> str:
    return render_template("index.html")
