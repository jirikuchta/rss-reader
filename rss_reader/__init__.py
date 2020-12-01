import os

from flask import Flask

from rss_reader.logger import init as init_logger
from rss_reader.models import init as init_db
from rss_reader.views import init as init_views
from rss_reader.api import init as init_api


def create_app():
    app = Flask(
        __name__,
        static_folder="static/dist",
        static_url_path="/static")

    init_config(app)
    init_logger(app)
    init_db(app)
    init_views(app)
    init_api(app)

    app.logger.info("Started successfully.")
    app.logger.debug("Application config: \n" +
                     "\n".join([f"{k}: {app.config[k]}" for k in app.config]))

    return app


def init_config(app: Flask) -> None:
    app.config.from_pyfile("config.default.cfg")
    app.config.from_envvar("RSS_READER_CONFIG_FILE", silent=True)
    for k, v in app.config.items():
        app.config[k] = os.getenv(k, default=v)

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_DATABASE_URI"] = app.config["DATABASE_URI"]
