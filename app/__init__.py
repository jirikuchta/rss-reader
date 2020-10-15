import os
import click

from flask import Flask
from flask.cli import with_appcontext
from flask_login import LoginManager  # type: ignore

import app.logger  # noqa: F401
from app.models import db, User, init as init_db
from app.views import init as init_views
from app.api import init as init_api


def create_app():
    flask_app = Flask(
        __name__,
        static_folder="static/dist",
        static_url_path="/static")

    init_app_config(flask_app)
    init_db(flask_app)
    init_login_manager(flask_app)
    init_api(flask_app)
    init_views(flask_app)

    flask_app.cli.add_command(create_db)
    flask_app.cli.add_command(create_user)
    flask_app.cli.add_command(drop_db)

    return flask_app


def init_app_config(flask_app: Flask) -> None:
    flask_app.config.from_pyfile("config.default.cfg")
    flask_app.config.from_envvar("RSS_READER_CONFIG_FILE", silent=True)
    for k, v in flask_app.config.items():
        flask_app.config[k] = os.getenv(k, default=v)


def init_login_manager(flask_app: Flask) -> None:
    login_manager = LoginManager()
    login_manager.init_app(flask_app)
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
