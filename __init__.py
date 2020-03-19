import os
import click
from flask import Flask, render_template
from flask.cli import with_appcontext

from rss_reader.parser import parse
from rss_reader.model import db
from rss_reader.model.feed import Feed, Entry


def create_app():
    app = Flask(__name__,
                static_folder="static/public",
                static_url_path="/static")

    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.cli.add_command(init_db_command)

    from rss_reader.api.feeds import bp as api_bp
    app.register_blueprint(api_bp)

    app.add_url_rule("/", view_func=lambda: render_template("index.html"))

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
