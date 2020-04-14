import enum

from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash


db = SQLAlchemy()


class UserRoles(enum.Enum):
    admin = "admin"
    user = "user"


class User(UserMixin, db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRoles),
                     nullable=False, default=UserRoles.user)

    subscriptions = db.relationship(
        "Subscription", back_populates="user",
        cascade="save-update, merge, delete, delete-orphan")

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        self.password = generate_password_hash(self.password, method="sha256")

    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role.value}


class Feed(db.Model):
    __tablename__ = "feed"

    id = db.Column(db.Integer, primary_key=True)
    uri = db.Column(db.String(255), nullable=False, unique=True)
    title = db.Column(db.Text, nullable=False)

    entries = db.relationship(
        "FeedEntry", back_populates="feed",
        cascade="save-update, merge, delete, delete-orphan")

    subscriptions = db.relationship(
        "Subscription", back_populates="feed",
        cascade="save-update, merge, delete, delete-orphan")

    @classmethod
    def from_parser(cls, parser):
        return cls(
            uri=parser.link,
            title=parser.title,
            entries=[FeedEntry.from_parser(item) for item in parser.items])


class FeedEntry(db.Model):
    __tablename__ = "feed_entry"
    __table_args__ = (db.UniqueConstraint("feed_id", "guid"),)

    id = db.Column(db.Integer, primary_key=True)

    feed_id = db.Column(db.Integer,
                        db.ForeignKey("feed.id", ondelete="CASCADE"),
                        nullable=False)
    guid = db.Column(db.String(255), nullable=False, index=True)
    title = db.Column(db.Text, nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text)
    content = db.Column(db.Text)
    comments_uri = db.Column(db.String(255))
    author = db.Column(db.String(255))

    feed = db.relationship("Feed", back_populates="entries")

    subscriptions = db.relationship(
        "SubscriptionEntry", back_populates="feed_entry",
        cascade="save-update, merge, delete, delete-orphan")

    @classmethod
    def from_parser(cls, parser):
        return cls(
            guid=parser.id,
            title=parser.title,
            uri=parser.link,
            summary=parser.summary,
            content=parser.content,
            comments_uri=parser.comments_link,
            author=parser.author)


class Subscription(db.Model):
    __tablename__ = "subscription"
    __table_args__ = (db.PrimaryKeyConstraint("user_id", "feed_id"),)

    user_id = db.Column(db.Integer,
                        db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False)
    feed_id = db.Column(db.Integer,
                        db.ForeignKey("feed.id", ondelete="CASCADE"),
                        nullable=False)
    title = db.Column(db.Text, nullable=True)

    user = db.relationship("User", back_populates="subscriptions")
    feed = db.relationship("Feed", back_populates="subscriptions")

    entries = db.relationship(
        "SubscriptionEntry", back_populates="subscription",
        cascade="save-update, merge, delete, delete-orphan")

    def to_json(self):
        return {
            "id": self.feed.id,
            "title": self.title if self.title is not None else self.feed.title,
            "uri": self.feed.uri,
            "items": [entry.to_json() for entry in self.entries]}


class SubscriptionEntry(db.Model):
    __tablename__ = "subscription_entry"
    __table_args__ = (
        db.PrimaryKeyConstraint("user_id", "entry_id"),
        db.ForeignKeyConstraint(["feed_id", "user_id"],
                                refcolumns=["subscription.feed_id",
                                            "subscription.user_id"],
                                ondelete="CASCADE"))

    user_id = db.Column(db.Integer,
                        db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False)
    entry_id = db.Column(db.Integer,
                         db.ForeignKey("feed_entry.id", ondelete="CASCADE"),
                         nullable=False)
    feed_id = db.Column(db.Integer, nullable=False)
    unread = db.Column(db.Boolean, nullable=False, default=True, index=True)
    starred = db.Column(db.Boolean, nullable=False, default=False, index=True)

    subscription = db.relationship("Subscription", back_populates="entries")
    feed_entry = db.relationship("FeedEntry", back_populates="subscriptions")

    def to_json(self):
        return {
            "id": self.feed_entry.id,
            "title": self.feed_entry.title,
            "uri": self.feed_entry.uri,
            "summary": self.feed_entry.summary,
            "content": self.feed_entry.content,
            "comments_uri": self.feed_entry.comments_uri,
            "author": self.feed_entry.author,
            "unread": self.unread,
            "starred": self.starred}
