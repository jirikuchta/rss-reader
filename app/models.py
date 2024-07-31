from datetime import datetime

from flask import Flask
from flask_sqlalchemy import SQLAlchemy  # type: ignore
from sqlalchemy import func, event, engine  # type: ignore

from lib.feedparser import FeedParser, FeedItemParser


db = SQLAlchemy()


def init(app: Flask) -> None:
    db.init_app(app)

    # https://docs.sqlalchemy.org/en/13/dialects/sqlite.html#foreign-key-support
    if app.config.get("SQLALCHEMY_DATABASE_URI", "").startswith("sqlite"):
        @event.listens_for(engine.Engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.close()

    with app.app_context():
        db.create_all()
        db.session.commit()


class Model:
    def __str__(self):
        return f"<{type(self).__name__} {self.id}>"

    def __repr__(self):
        return f"<{type(self).__name__} {self.__dict__}>"


class Category(Model, db.Model):  # type: ignore
    __tablename__ = "category"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False, unique=True)

    subscriptions = db.relationship("Subscription", back_populates="category")

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title}


class Subscription(Model, db.Model):  # type: ignore
    __tablename__ = "subscription"

    id = db.Column(db.Integer, primary_key=True)
    feed_url = db.Column(db.String(255), nullable=False, unique=True)
    hash = db.Column(db.String(255), nullable=False)
    title = db.Column(db.Text)
    web_url = db.Column(db.String(255))
    favorite = db.Column(db.Boolean, nullable=False, default=False)

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("category.id", ondelete="SET NULL"),
        index=True)
    time_updated = db.Column(
        db.DateTime,
        index=True, server_default=func.now())

    category = db.relationship("Category", back_populates="subscriptions")

    @classmethod
    def from_parser(cls, parser: FeedParser, **kwargs):
        return cls(
            title=parser.title,
            feed_url=parser.feed_url,
            web_url=parser.web_url,
            hash=parser.hash,
            **kwargs)

    def to_json(self):
        keys = ("id", "title", "feed_url", "web_url",
                "category_id", "favorite")
        return {key: getattr(self, key) for key in keys}


class Article(Model, db.Model):  # type: ignore
    __tablename__ = "article"
    __table_args__ = (db.UniqueConstraint("subscription_id", "guid"),)

    id = db.Column(db.Integer, primary_key=True)
    guid = db.Column(db.String(255), nullable=False, index=True)
    hash = db.Column(db.String(255), nullable=False)
    title = db.Column(db.Text)
    url = db.Column(db.String(255))
    summary = db.Column(db.Text)
    content = db.Column(db.Text)
    comments_url = db.Column(db.String(255))
    image_url = db.Column(db.String(255))
    author = db.Column(db.String(255))
    read = db.Column(db.Boolean, nullable=False, default=False, index=True)
    bookmarked = db.Column(db.Boolean, nullable=False, default=False, index=True)
    time_published = db.Column(
        db.DateTime,
        nullable=False, server_default=func.now(), index=True)
    subscription_id = db.Column(
        db.Integer,
        db.ForeignKey("subscription.id", ondelete="CASCADE"),
        index=True, nullable=False)

    @classmethod
    def from_parser(cls, parser: FeedItemParser, **kwargs):
        return cls().update(parser, **kwargs)

    def update(self, parser: FeedItemParser, **kwargs):
        parser_attrs = ["guid", "hash", "title", "url", "summary", "content",
                        "comments_url", "author", "image_url"]
        for attr in parser_attrs:
            setattr(self, attr, getattr(parser, attr))

        if getattr(parser, "time_published") is not None:
            setattr(self, "time_published",
                    min(datetime.now(), getattr(parser, "time_published")))

        for key in kwargs:
            setattr(self, key, kwargs[key])

        return self

    def to_json(self):
        keys = ("id", "title", "url", "summary", "content", "comments_url",
                "author", "subscription_id", "time_published", "read",
                "bookmarked", "image_url",)
        return {key: getattr(self, key) for key in keys}
