from flask import Blueprint, jsonify, abort
from flask_login import current_user
from functools import wraps

from .model import Feed, Entry


bp = Blueprint("api", __name__, url_prefix="/api")


def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            abort(401)
        func(*args, **kwargs)
    return wrapper


@bp.route("/feeds/")
@login_required
def list_feeds():
    feeds = Feed.query.filter(Feed.user_id == current_user.id).all()
    return jsonify([feed.to_json() for feed in feeds])


@bp.route("/feeds/entries/")
@login_required
def list_all_entries():
    entries = Entry.query.filter(Entry.user_id == current_user.id).all()
    return jsonify([entry.to_json() for entry in entries])


@bp.route("/feeds/<int:feed_id>/")
@login_required
def get_feed(feed_id: int):
    feed = Feed.query.get_or_404(feed_id)
    if feed.user_id != current_user.id:
        abort(403)
    return jsonify(feed.to_json())


@bp.route("/feeds/<int:feed_id>/entries/")
@login_required
def list_feed_entries(feed_id: int):
    feed = Feed.query.get_or_404(feed_id)
    if feed.user_id != current_user.id:
        abort(403)
    return jsonify([entry.to_json() for entry in feed.entries])
