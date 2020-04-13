import os
import click
from flask import Flask
from flask.cli import with_appcontext
from flask_login import LoginManager
from werkzeug.security import generate_password_hash

from rss_reader.lib.models import db, User, UserRoles


def create_app():
    app = Flask(__name__,
                static_folder="static/dist",
                static_url_path="/static")

    if os.environ.get("SECRET_KEY") is not None:
        app.config["SECRET_KEY"] = str.encode(os.environ.get("SECRET_KEY"))
    app.config["TESTING"] = bool(os.environ.get("TESTING", False))
    app.config["DEBUG"] = bool(os.environ.get("DEBUG", False))
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

    from rss_reader.lib.api import api
    app.register_blueprint(api)

    app.cli.add_command(init_db_cmd)

    return app


@click.command("init-db")
@with_appcontext
def init_db_cmd():
    db.drop_all()
    db.create_all()
    db.session.add(User(username="admin", password="admin",
                        role=UserRoles.admin))
    db.session.add(User(username="user", password="user",
                        role=UserRoles.user))
    db.session.commit()
