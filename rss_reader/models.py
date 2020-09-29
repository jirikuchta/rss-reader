import enum

from flask_login import UserMixin, current_user
from flask_sqlalchemy import SQLAlchemy

from werkzeug.security import generate_password_hash


db = SQLAlchemy()


class UserRole(enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(UserMixin, db.Model):  # type: ignore
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole),
                     nullable=False, default=UserRole.USER)

    subscriptions = db.relationship(
        "Subscription", cascade="save-update, merge, delete, delete-orphan")

    categories = db.relationship(
        "Category", cascade="save-update, merge, delete, delete-orphan")

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        self.password = generate_password_hash(self.password, method="sha256")

    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role.value}


class Category(db.Model):  # type: ignore
    __tablename__ = "category"
    __table_args__ = (db.UniqueConstraint("user_id", "title"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer,
                        db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False)
    title = db.Column(db.Text, nullable=False)

    subscriptions = db.relationship("Subscription")

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title}


class Subscription(db.Model):  # type: ignore
    __tablename__ = "subscription"
    __table_args__ = (db.UniqueConstraint("user_id", "uri"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer,
                        db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    category_id = db.Column(db.Integer,
                            db.ForeignKey("category.id",
                                          ondelete="SET NULL"),
                            nullable=True)
    title = db.Column(db.Text, nullable=False)
    update_planned = db.Column(db.Boolean, index=True, nullable=False,
                               default=False)
    time_last_updated = db.Column(db.DateTime, nullable=True, index=True)

    user = db.relationship("User", back_populates="subscriptions")

    articles = db.relationship(
        "Article", back_populates="subscription",
        cascade="save-update, merge, delete, delete-orphan")

    @classmethod
    def from_parser(cls, parser):
        return cls(
            user_id=current_user.id,
            uri=parser.link,
            title=parser.title,
            articles=[Article.from_parser(item) for item in parser.items])

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "uri": self.uri,
            "categoryId": self.category_id}


class Article(db.Model):  # type: ignore
    __tablename__ = "article"
    __table_args__ = (db.UniqueConstraint("subscription_id", "guid"),)

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(
        db.Integer,
        db.ForeignKey("subscription.id", ondelete="CASCADE"),
        nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False)
    guid = db.Column(db.String(255), nullable=False, index=True)
    title = db.Column(db.Text, nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text)
    content = db.Column(db.Text)
    comments_uri = db.Column(db.String(255))
    author = db.Column(db.String(255))
    read = db.Column(db.DateTime, nullable=True, index=True)
    starred = db.Column(db.DateTime, nullable=True, index=True)

    subscription = db.relationship("Subscription", back_populates="articles")

    @classmethod
    def from_parser(cls, parser):
        return cls(
            user_id=current_user.id,
            guid=parser.id,
            title=parser.title,
            uri=parser.link,
            summary=parser.summary,
            content=parser.content,
            comments_uri=parser.comments_link,
            author=parser.author)

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
