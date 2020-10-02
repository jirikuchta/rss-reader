import os
import click

from flask import Flask
from flask.cli import with_appcontext
from flask_login import LoginManager
from sqlalchemy import event
from sqlalchemy.engine import Engine

from rss_reader.models import db, User


def create_app():
    app = Flask(__name__,
                static_folder="static/dist",
                static_url_path="/static")

    app.config["SECRET_KEY"] = str.encode(os.environ.get("SECRET_KEY"))
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # https://docs.sqlalchemy.org/en/13/dialects/sqlite.html#foreign-key-support
    if os.environ.get("DATABASE_URI").startswith("sqlite"):
        @event.listens_for(Engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.close()

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "views.login"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from rss_reader.views import views
    app.register_blueprint(views)

    from rss_reader.api import api
    import rss_reader.api.users  # noqa
    import rss_reader.api.subscriptions  # noqa
    import rss_reader.api.articles  # noqa
    import rss_reader.api.categories  # noqa
    app.register_blueprint(api)

    app.cli.add_command(create_db)
    app.cli.add_command(create_user)
    app.cli.add_command(drop_db)

    return app


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
