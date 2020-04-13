import sqlalchemy
from flask import Blueprint, jsonify, abort, request
from flask_login import current_user
from functools import wraps

from rss_reader.lib.models import db, User, Feed, FeedEntry, Subscription, \
    SubscriptionEntry, UserRoles
from rss_reader.parser import parse


api = Blueprint("api", __name__, url_prefix="/api")


def endpoint(login_required: bool = True):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if login_required and not current_user.is_authenticated:
                abort(401)
            data, status = func(*args, **kwargs)
            return jsonify({"data": data, "status": status})
        return wrapper
    return decorator


@api.route("/users/", methods=["GET"])
@endpoint(login_required=True)
def list_users():
    if current_user.role != UserRoles.admin:
        return (None, "permission_denied")

    users = User.query.all()
    return ([user.to_json() for user in users], "ok")


@api.route("/users/", methods=["POST"])
@endpoint(login_required=True)
def create_user():
    if current_user.role != UserRoles.admin:
        return (None, "permission_denied")

    username = request.form.get("username")
    password = request.form.get("password")
    role = request.form.get("role")

    if not username:
        return (None, "username_required")

    if not password:
        return (None, "password_required")

    if role:
        try:
            role = UserRoles[role]
        except KeyError:
            return (None, "unsupported_role")

    if db.session.query(User).filter(User.username == username).first():
        return (None, "username_taken")

    user = User(username=username, password=password, role=role)

    db.session.add(user)
    db.session.commit()

    return (user.to_json(), "ok")


@api.route("/subscriptions/", methods=["GET"])
@endpoint(login_required=True)
def list_subscriptions():
    subscriptions = Subscription.query.filter(
        Subscription.user_id == current_user.id).all()
    return ([subscription.to_json() for subscription in subscriptions], "ok")


@api.route("/subscriptions/", methods=["POST"])
@endpoint(login_required=True)
def subscribe():
    feed = Feed.query.filter(Feed.uri == request.form.get("uri")).first()

    if feed is None:
        try:
            parser = parse(request.form.get("uri"))
        except Exception:
            return (None, "parser_error")

        feed = Feed(
            uri=parser.link,
            title=parser.title,
            entries=[FeedEntry(
                guid=item.id,
                title=item.title,
                uri=item.link,
                summary=item.summary,
                content=item.content,
                comments_uri=item.comments_link,
                author=item.author) for item in parser.items])

    subscription = Subscription(
        user_id=current_user.id,
        feed=feed,
        entries=feed.entries)

    db.session.add(user_feed)
    db.session.commit()

    return (feed.to_json(), "ok")


@api.route("/subscriptions/<int:feed_id>/", methods=["GET"])
@endpoint(login_required=True)
def get_subscription(feed_id: int):
    subscription = Subscription.query.filter(
        Subscription.user_id == current_user.id,
        Subscription.feed_id == feed_id)

    if not subscription:
        return (None, "not_found")

    return (subscription.to_json(), "ok")


@api.route("/subscriptions/<int:feed_id>/", methods=["DELETE"])
@endpoint(login_required=True)
def unsubscribe(feed_id: int):
    subscription = Subscription.query.filter(
        Subscription.user_id == current_user.id,
        Subscription.feed_id == feed_id).first()

    if not subscription:
        return (None, "not_found")

    db.session.delete(subscription)
    db.session.commit()

    return (None, "ok")


@api.route("/subscriptions/<int:feed_id>/entries/", methods=["GET"])
@endpoint(login_required=True)
def list_subscription_entries(feed_id: int):
    subscription = Subscription.query.filter(
        Subscription.user_id == current_user.id,
        Subscription.feed_id == feed_id).first()

    if not subscription:
        return (None, "not_found")

    return ([entry.to_json() for entry in subscription.entries], "ok")


@api.route("/subscriptions/entries/", methods=["GET"])
@endpoint(login_required=True)
def list_all_entries():
    entries = SubscriptionEntry.query.filter(
        SubscriptionEntry.user_id == current_user.id).all()
    return ([entry.to_json() for entry in entries], "ok")
