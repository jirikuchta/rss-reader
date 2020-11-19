import os
import click

from flask import Flask
from flask.cli import with_appcontext
from flask_login import LoginManager  # type: ignore

from rss_reader.logger import init as init_logger
from rss_reader.models import db, User, init as init_db
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
    init_login_manager(app)
    init_views(app)
    init_api(app)

    app.cli.add_command(create_db)
    app.cli.add_command(create_user)
    app.cli.add_command(drop_db)

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
    app.config["SQLALCHEMY_ECHO"] = app.config["DEBUG"]


def init_login_manager(app: Flask) -> None:
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "views.login"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))


@click.command("create-db")
@with_appcontext
def create_db():
    db.create_all()
    db.session.commit()


@click.command("create-user")
@click.argument("username")
@click.argument("password")
@with_appcontext
def create_user(username: str, password: str) -> None:
    db.session.add(User(username=username, password=password))
    db.session.commit()


@click.command("drop-db")
@with_appcontext
def drop_db():
    db.drop_all()
    db.session.commit()
