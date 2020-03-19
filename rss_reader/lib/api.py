from flask import Blueprint, jsonify

from .model import Feed, Entry


bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/feeds/")
def list_feeds():
    feeds = Feed.query.all()
    return jsonify([feed.to_json() for feed in feeds])


@bp.route("/entries/")
@bp.route("/entries/<int:feed_id>/")
def list_entries(feed_id: int = None):
    if feed_id is not None:
        entries = Entry.query.filter(Entry.feed_id == feed_id).all()
    else:
        entries = Entry.query.all()

    return jsonify([entry.to_json() for entry in entries])
