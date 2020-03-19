from rss_reader.model import db


class Feed(db.Model):
    __tablename__ = "feed"

    id = db.Column(db.Integer, primary_key=True)
    uri = db.Column(db.String(255), nullable=False)
    title = db.Column(db.Text, nullable=False)

    entries = db.relationship(
        "Entry", back_populates="feed",
        cascade="save-update, merge, delete, delete-orphan")


class Entry(db.Model):
    __tablename__ = "entry"

    id = db.Column(db.Integer, primary_key=True)
    feed_id = db.Column(db.Integer,
                        db.ForeignKey("feed.id", ondelete="CASCADE"),
                        nullable=False)
    title = db.Column(db.Text, nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text)
    content = db.Column(db.Text)
    comments_uri = db.Column(db.String(255))
    author = db.Column(db.String(255))

    feed = db.relationship("Feed", back_populates="entries")
