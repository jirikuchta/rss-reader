from flask import Blueprint, jsonify, abort, request
from flask_login import current_user
from functools import wraps

from rss_reader.lib.model import db, Feed, Entry
from rss_reader.parser import parse


bp = Blueprint("api", __name__, url_prefix="/api")


def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            abort(401)
        return func(*args, **kwargs)
    return wrapper


@bp.route("/feeds/", methods=["GET"])
@login_required
def list_feeds():
    feeds = Feed.query.filter(Feed.user_id == current_user.id).all()
    return jsonify([feed.to_json() for feed in feeds])


@bp.route("/feeds/", methods=["POST"])
@login_required
def add_feed():
    try:
        parser = parse(request.form.get("uri"))
    except Exception:
        abort(400)

    feed = Feed(
        user_id=current_user.id,
        uri=parser.link,
        title=parser.title,
        entries=[Entry(
            user_id=current_user.id,
            guid=item.id,
            title=item.title,
            uri=item.link,
            summary=item.summary,
            content=item.content,
            comments_uri=item.comments_link,
            author=item.author) for item in parser.items])

    db.session.add(feed)
    db.session.flush()
    db.session.commit()

    return jsonify(feed.to_json())


@bp.route("/feeds/<int:feed_id>/", methods=["GET"])
@login_required
def get_feed(feed_id: int):
    feed = Feed.query.get_or_404(feed_id)
    if feed.user_id != current_user.id:
        abort(403)
    return jsonify(feed.to_json())


@bp.route("/feeds/<int:feed_id>/", methods=["DELETE"])
@login_required
def delete_feed(feed_id: int):
    feed = Feed.query.get_or_404(feed_id)
    if feed.user_id != current_user.id:
        abort(403)
    db.session.delete(feed)
    db.session.commit()
    return jsonify({})


@bp.route("/feeds/<int:feed_id>/entries/", methods=["GET"])
@login_required
def list_feed_entries(feed_id: int):
    feed = Feed.query.get_or_404(feed_id)
    if feed.user_id != current_user.id:
        abort(403)
    return jsonify([entry.to_json() for entry in feed.entries])


@bp.route("/feeds/entries/", methods=["GET"])
@login_required
def list_all_entries():
    entries = Entry.query.filter(Entry.user_id == current_user.id).all()
    return jsonify([entry.to_json() for entry in entries])
