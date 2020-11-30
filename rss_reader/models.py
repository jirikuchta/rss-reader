from flask import Flask
from flask_login import UserMixin  # type: ignore
from flask_sqlalchemy import SQLAlchemy  # type: ignore
from sqlalchemy import func, event, engine  # type: ignore

from werkzeug.security import generate_password_hash

from rss_reader.parser import FeedParser, FeedItemParser


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


class Repr:
    def __str__(self):
        return f"<{type(self).__name__} {self.id}>"

    def __repr__(self):
        return f"<{type(self).__name__} {self.__dict__}>"


class User(Repr, UserMixin, db.Model):  # type: ignore
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        self.set_password(self.password)

    def set_password(self, password: str) -> None:
        self.password = generate_password_hash(password, method="sha256")

    def to_json(self):
        return {"id": self.id, "username": self.username}


class Category(Repr, db.Model):  # type: ignore
    __tablename__ = "category"
    __table_args__ = (db.UniqueConstraint("user_id", "title"),)

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False)

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title}


class Subscription(Repr, db.Model):  # type: ignore
    __tablename__ = "subscription"
    __table_args__ = (db.UniqueConstraint("user_id", "feed_url"),)

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    feed_url = db.Column(db.String(255), nullable=False)
    web_url = db.Column(db.String(255), nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("category.id", ondelete="SET NULL"))
    time_updated = db.Column(
        db.DateTime,
        index=True, server_default=func.now())

    @classmethod
    def from_parser(cls, parser: FeedParser, **kwargs):
        return cls(
            title=parser.title,
            web_url=parser.web_url,
            **kwargs)

    def to_json(self):
        keys = ("id", "title", "feed_url", "web_url", "category_id",)
        return {key: getattr(self, key) for key in keys}


class Article(Repr, db.Model):  # type: ignore
    __tablename__ = "article"
    __table_args__ = (db.UniqueConstraint("subscription_id", "guid"),)

    id = db.Column(db.Integer, primary_key=True)
    guid = db.Column(db.String(255), nullable=False, index=True)
    hash = db.Column(db.String(255), nullable=False)
    title = db.Column(db.Text, nullable=False)
    url = db.Column(db.String(255))
    summary = db.Column(db.Text)
    content = db.Column(db.Text)
    comments_url = db.Column(db.String(255))
    author = db.Column(db.String(255))
    time_published = db.Column(
        db.DateTime,
        nullable=False, server_default=func.now())
    time_created = db.Column(
        db.DateTime,
        nullable=False, server_default=func.now(), index=True)
    time_read = db.Column(db.DateTime, index=True)
    time_starred = db.Column(db.DateTime, index=True)
    subscription_id = db.Column(
        db.Integer,
        db.ForeignKey("subscription.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False)

    @classmethod
    def from_parser(cls, parser: FeedItemParser, **kwargs):
        return cls().update(parser, **kwargs)

    def update(self, parser: FeedItemParser, **kwargs):
        parser_attrs = ["guid", "hash", "title", "url", "summary", "content",
                        "comments_url", "author", "time_published"]
        for attr in parser_attrs:
            setattr(self, attr, getattr(parser, attr))

        for key in kwargs:
            setattr(self, key, kwargs[key])

        self.time_read = None

        return self

    def to_json(self):
        keys = ("id", "title", "url", "summary", "content", "comments_url",
                "author", "subscription_id", "time_published", "time_read",
                "time_starred",)
        return {key: getattr(self, key) for key in keys}