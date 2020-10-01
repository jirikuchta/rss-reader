from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

from werkzeug.security import generate_password_hash


db = SQLAlchemy()


class User(UserMixin, db.Model):  # type: ignore
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


class Category(db.Model):  # type: ignore
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


class Subscription(db.Model):  # type: ignore
    __tablename__ = "subscription"
    __table_args__ = (db.UniqueConstraint("user_id", "feed_url"),)

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    feed_url = db.Column(db.String(255), nullable=False, index=True)
    web_url = db.Column(db.String(255), nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("category.id", ondelete="SET NULL"), nullable=True)
    update_planned = db.Column(
        db.Boolean,
        index=True, nullable=False, default=False)
    time_last_updated = db.Column(
        db.DateTime,
        index=True, nullable=True)

    @classmethod
    def from_parser(cls, parser, **kwargs):
        return cls(title=parser.title, web_url=parser.web_url, **kwargs)

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "feed_url": self.feed_url,
            "web_url": self.web_url,
            "category_id": self.category_id}


class Article(db.Model):  # type: ignore
    __tablename__ = "article"
    __table_args__ = (db.UniqueConstraint("subscription_id", "guid"),)

    id = db.Column(db.Integer, primary_key=True)
    guid = db.Column(db.String(255), nullable=False, index=True)
    title = db.Column(db.Text, nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text)
    content = db.Column(db.Text)
    comments_uri = db.Column(db.String(255))
    author = db.Column(db.String(255))
    read = db.Column(db.DateTime, nullable=True, index=True)
    starred = db.Column(db.DateTime, nullable=True, index=True)
    subscription_id = db.Column(
        db.Integer,
        db.ForeignKey("subscription.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False)

    @classmethod
    def from_parser(cls, parser, **kwargs):
        return cls(
            guid=parser.id,
            title=parser.title,
            uri=parser.link,
            summary=parser.summary,
            content=parser.content,
            comments_uri=parser.comments_link,
            author=parser.author,
            **kwargs)

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "uri": self.uri,
            "summary": self.summary,
            "content": self.content,
            "comments_uri": self.comments_uri,
            "author": self.author,
            "subscription_id": self.subscription_id,
            "read": self.read,
            "starred": self.starred}
