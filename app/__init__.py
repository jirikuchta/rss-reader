import os
import click

from flask import Flask
from flask.cli import with_appcontext
from flask_login import LoginManager  # type: ignore
from sqlalchemy import event  # type: ignore
from sqlalchemy.engine import Engine  # type: ignore

from app.models import db, User


def create_app():
    flask_app = Flask(__name__,
                      static_folder="static/dist", static_url_path="/static")

    flask_app.config.from_pyfile("config.default.cfg")
    flask_app.config.from_envvar("RSS_READER_CONFIG_FILE", silent=True)
    for k, v in flask_app.config.items():
        flask_app.config[k] = os.getenv(k, default=v)

    db.init_app(flask_app)

    # https://docs.sqlalchemy.org/en/13/dialects/sqlite.html#foreign-key-support
    if flask_app.config.get("SQLALCHEMY_DATABASE_URI").startswith("sqlite"):
        @event.listens_for(Engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.close()

    login_manager = LoginManager()
    login_manager.init_app(flask_app)
    login_manager.login_view = "views.login"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from app.views import views
    flask_app.register_blueprint(views)

    from app.api import api
    import app.api.users  # noqa: F401
    import app.api.subscriptions  # noqa: F401
    import app.api.articles  # noqa: F401
    import app.api.categories  # noqa: F401
    flask_app.register_blueprint(api)

    flask_app.cli.add_command(create_db)
    flask_app.cli.add_command(create_user)
    flask_app.cli.add_command(drop_db)

    return flask_app


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
