import os
import click
from flask import Flask
from flask.cli import with_appcontext
from flask_login import LoginManager, UserMixin
from werkzeug.security import generate_password_hash


from rss_reader.parser import parse
from rss_reader.lib.model import db, User, Feed, Entry


class LoginUser(UserMixin):
    pass


def create_app():
    app = Flask(__name__,
                static_folder="static/public",
                static_url_path="/static")

    app.config["SECRET_KEY"] = b'secret_key'  # FIXME
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "views.login"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from rss_reader.lib.views import bp as views_bp
    app.register_blueprint(views_bp)

    from rss_reader.lib.api import bp as api_bp
    app.register_blueprint(api_bp)

    app.cli.add_command(init_db_command)

    return app


@click.command("init-db")
@with_appcontext
def init_db_command():
    db.drop_all()
    db.create_all()

    user = User(username="admin",
                password=generate_password_hash("admin", method="sha256"))

    TEST_FEEDS = (
        "https://historje.tumblr.com/rss",
        "http://feeds.feedburner.com/CssTricks")

    for feed_uri in TEST_FEEDS:
        parser = parse(feed_uri)
        feed = Feed(
            uri=parser.link,
            title=parser.title,
            entries=[Entry(
                user=user,
                guid=item.id,
                title=item.title,
                uri=item.link,
                summary=item.summary,
                content=item.content,
                comments_uri=item.comments_link,
                author=item.author) for item in parser.items])
        user.feeds.append(feed)

    db.session.add(user)
    db.session.commit()
