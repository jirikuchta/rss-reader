import os
import click
from flask import Flask, render_template
from flask.cli import with_appcontext

from rss_reader.parser import parse
from rss_reader.lib.model import db, User, Feed, Entry, UserEntry


def create_app():
    app = Flask(__name__,
                static_folder="static/public",
                static_url_path="/static")

    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.cli.add_command(init_db_command)

    from rss_reader.lib.api import bp as api_bp
    app.register_blueprint(api_bp)

    app.add_url_rule("/", view_func=lambda: render_template("index.html"))

    return app


@click.command("init-db")
@with_appcontext
def init_db_command():
    db.drop_all()
    db.create_all()

    user = User(username="admin", password="admin")
    db.session.add(user)
    db.session.flush()

    TEST_FEEDS = (
        "https://historje.tumblr.com/rss",
        "http://feeds.feedburner.com/CssTricks")

    for feed_uri in TEST_FEEDS:
        parser = parse(feed_uri)

        feed = Feed(
            user=user,
            uri=parser.link,
            title=parser.title)

        entries = [Entry(
            guid=item.id,
            title=item.title,
            uri=item.link,
            summary=item.summary,
            content=item.content,
            comments_uri=item.comments_link,
            author=item.author) for item in parser.items]

        for entry in entries:
            feed.entries.append(entry)
            db.session.add(UserEntry(user=user, entry=entry))

        db.session.add(feed)

    db.session.commit()
