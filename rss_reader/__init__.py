import os
import click
from flask import Flask
from flask.cli import with_appcontext
from flask_login import LoginManager  # type: ignore

from rss_reader.lib.models import db, User, UserRole


def create_app():
    app = Flask(__name__,
                static_folder="static/dist",
                static_url_path="/static")

    if os.environ.get("SECRET_KEY") is not None:
        app.config["SECRET_KEY"] = str.encode(os.environ.get("SECRET_KEY"))
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "views.login"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from rss_reader.lib.views import views
    app.register_blueprint(views)

    from rss_reader.api import api
    import rss_reader.api.users
    import rss_reader.api.subscriptions
    import rss_reader.api.articles
    import rss_reader.api.categories  # noqa
    app.register_blueprint(api)

    app.cli.add_command(create_db)
    app.cli.add_command(drop_db)

    return app


@click.command("create-db")
@with_appcontext
def create_db():
    db.create_all()
    if User.query.filter(User.username == "admin").first() is None:
        db.session.add(User(username="admin", password="admin",
                            role=UserRole.admin))
    db.session.commit()


@click.command("drop-db")
@with_appcontext
def drop_db():
    db.drop_all()
    db.session.commit()
