from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)

    feeds = db.relationship(
        "Feed", back_populates="user",
        cascade="save-update, merge, delete, delete-orphan")

    entries = db.relationship(
        "UserEntry", back_populates="user",
        cascade="save-update, merge, delete, delete-orphan")


class Feed(db.Model):
    __tablename__ = "feed"
    __table_args__ = (db.UniqueConstraint("user_id", "uri"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer,
                        db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    title = db.Column(db.Text, nullable=False)

    user = db.relationship("User", back_populates="feeds")

    entries = db.relationship(
        "Entry", back_populates="feed",
        cascade="save-update, merge, delete, delete-orphan")

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "uri": self.uri}


class Entry(db.Model):
    __tablename__ = "entry"
    __table_args__ = (db.UniqueConstraint("feed_id", "guid"),)

    id = db.Column(db.Integer, primary_key=True)
    feed_id = db.Column(db.Integer,
                        db.ForeignKey("feed.id", ondelete="CASCADE"),
                        nullable=False)
    guid = db.Column(db.String(255), nullable=False)
    title = db.Column(db.Text, nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text)
    content = db.Column(db.Text)
    comments_uri = db.Column(db.String(255))
    author = db.Column(db.String(255))

    feed = db.relationship("Feed", back_populates="entries")

    def to_json(self):
        return {
            "id": self.id,
            "guid": self.guid,
            "feed_id": self.feed_id,
            "title": self.title,
            "summary": self.summary,
            "content": self.content,
            "comments_uri": self.comments_uri,
            "author": self.author}


class UserEntry(db.Model):
    __tablename__ = "user_entry"

    user_id = db.Column(db.Integer,
                        db.ForeignKey("user.id", ondelete="CASCADE"),
                        primary_key=True)
    entry_id = db.Column(db.Integer,
                         db.ForeignKey("entry.id", ondelete="CASCADE"),
                         primary_key=True)

    user = db.relationship("User", back_populates="entries")
    entry = db.relationship("Entry")
