import enum

from flask_login import UserMixin  # type: ignore
from flask_sqlalchemy import SQLAlchemy  # type: ignore
from werkzeug.security import generate_password_hash


db = SQLAlchemy()


class UserRole(enum.Enum):
    admin = "admin"
    user = "user"


class User(UserMixin, db.Model):  # type: ignore
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole),
                     nullable=False, default=UserRole.user)

    subscriptions = db.relationship(
        "Subscription", cascade="save-update, merge, delete, delete-orphan")

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        self.password = generate_password_hash(self.password, method="sha256")

    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role.value}


class Feed(db.Model):  # type: ignore
    __tablename__ = "feed"

    id = db.Column(db.Integer, primary_key=True)
    uri = db.Column(db.String(255), nullable=False, unique=True)
    title = db.Column(db.Text, nullable=False)

    entries = db.relationship(
        "FeedEntry", cascade="save-update, merge, delete, delete-orphan")

    @classmethod
    def from_parser(cls, parser):
        return cls(
            uri=parser.link,
            title=parser.title,
            entries=[FeedEntry.from_parser(item) for item in parser.items])


class FeedEntry(db.Model):  # type: ignore
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


class Subscription(db.Model):  # type: ignore
    __tablename__ = "subscription"
    __table_args__ = (db.PrimaryKeyConstraint("user_id", "feed_id"),)

    user_id = db.Column(db.Integer,
                        db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False)
    feed_id = db.Column(db.Integer,
                        db.ForeignKey("feed.id", ondelete="CASCADE"),
                        nullable=False)
    category_id = db.Column(db.Integer,
                            db.ForeignKey("subscription_category.id",
                                          ondelete="SET NULL"),
                            nullable=True)
    title = db.Column(db.Text, nullable=True)

    user = db.relationship("User", back_populates="subscriptions")
    category = db.relationship("SubscriptionCategory", lazy=False)
    feed = db.relationship("Feed", lazy=False)
    entries = db.relationship(
        "SubscriptionEntry", back_populates="subscription",
        cascade="save-update, merge, delete, delete-orphan")

    def __init__(self, **kwargs):
        super(Subscription, self).__init__(**kwargs)
        if self.feed:
            self.entries = [SubscriptionEntry(feed_entry=feed_entry)
                            for feed_entry in self.feed.entries]

    def to_json(self):
        title = self.title if self.title is not None else self.feed.title
        category = None if self.category is None else self.category.to_json()

        return {
            "id": self.feed.id,
            "title": title,
            "uri": self.feed.uri,
            "category": category}


class SubscriptionCategory(db.Model):  # type: ignore
    __tablename__ = "subscription_category"
    __table_args__ = (db.UniqueConstraint("user_id", "title"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer,
                        db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False)
    title = db.Column(db.Text, nullable=False)

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title}


class SubscriptionEntry(db.Model):  # type: ignore
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
    feed_entry = db.relationship("FeedEntry", lazy=False)

    def to_json(self):
        return {
            "id": self.feed_entry.id,
            "title": self.feed_entry.title,
            "uri": self.feed_entry.uri,
            "summary": self.feed_entry.summary,
            "content": self.feed_entry.content,
            "comments_uri": self.feed_entry.comments_uri,
            "author": self.feed_entry.author,
            "feed_id": self.feed_id,
            "unread": self.unread,
            "starred": self.starred}
