import os
import click
from flask import Flask
from flask.cli import with_appcontext

from backend.parser import parse
from backend.model import db
from backend.model.feed import Feed, Entry


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.cli.add_command(init_db_command)

    from . import api
    app.register_blueprint(api.bp)

    return app


@click.command("init-db")
@with_appcontext
def init_db_command():
    db.drop_all()
    db.create_all()

    TEST_FEEDS = (
        "https://historje.tumblr.com/rss",
        "http://feeds.feedburner.com/CssTricks")

    for feed_uri in TEST_FEEDS:
        parser = parse(feed_uri)
        db.session.add(Feed(
            uri=parser.link,
            title=parser.title,
            entries=[Entry(
                title=item.title,
                uri=item.link,
                summary=item.summary,
                content=item.content,
                comments_uri=item.comments_link,
                author=item.author) for item in parser.items]))

    db.session.commit()
