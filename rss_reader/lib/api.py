from flask import Blueprint, jsonify, abort, request
from flask_login import current_user
from functools import wraps

from rss_reader.lib.model import db, Feed, Entry
from rss_reader.parser import parse


api = Blueprint("api", __name__, url_prefix="/api")


def api_response(login_required: bool = True):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if login_required and not current_user.is_authenticated:
                abort(401)
            data, status = func(*args, **kwargs)
            return jsonify({"data": data, "status": status})
        return wrapper
    return decorator


@api.route("/feeds/", methods=["GET"])
@api_response(login_required=False)
def list_feeds():
    feeds = Feed.query.filter(Feed.user_id == current_user.id).all()
    return ([feed.to_json() for feed in feeds], "ok")


@api.route("/feeds/", methods=["POST"])
@api_response(login_required=True)
def add_feed():
    try:
        parser = parse(request.form.get("uri"))
    except Exception:
        return (None, "parser_error")

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

    return (feed.to_json(), "ok")


@api.route("/feeds/<int:feed_id>/", methods=["GET"])
@api_response(login_required=True)
def get_feed(feed_id: int):
    feed = Feed.query.get(feed_id)
    if not feed:
        return (None, "not_found")
    if feed.user_id != current_user.id:
        return (None, "permission_denied")
    return (feed.to_json(), "ok")


@api.route("/feeds/<int:feed_id>/", methods=["DELETE"])
@api_response(login_required=True)
def delete_feed(feed_id: int):
    feed = Feed.query.get(feed_id)
    if not feed:
        return (None, "not_found")
    if feed.user_id != current_user.id:
        return (None, "permission_denied")
    db.session.delete(feed)
    db.session.commit()
    return (None, "ok")


@api.route("/feeds/<int:feed_id>/entries/", methods=["GET"])
@api_response(login_required=True)
def list_feed_entries(feed_id: int):
    feed = Feed.query.get(feed_id)
    if not feed:
        return (None, "not_found")
    if feed.user_id != current_user.id:
        return (None, "permission_denied")
    return ([entry.to_json() for entry in feed.entries], "ok")


@api.route("/feeds/entries/", methods=["GET"])
@api_response(login_required=True)
def list_all_entries():
    entries = Entry.query.filter(Entry.user_id == current_user.id).all()
    return ([entry.to_json() for entry in entries], "ok")
