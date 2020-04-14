from flask import request
from flask_login import current_user

from rss_reader.lib.models import db, Feed, Subscription
from rss_reader.parser import parse

import rss_reader.api.response as res
from rss_reader.api import api, login_required


@api.route("/subscriptions/", methods=["GET"])
@login_required
def list_subscriptions():
    subscriptions = Subscription.query.filter(
        Subscription.user == current_user).all()
    return res.ok([subscription.to_json() for subscription in subscriptions])


@api.route("/subscriptions/", methods=["PUT"])
@login_required
def subscribe():
    if request.json is None:
        return res.bad_request()

    uri = request.json.get("uri")
    if not uri:
        return res.missing_field("uri")

    try:
        parser = parse(uri)
        uri = parser.link
    except Exception:
        return res.parser_error()

    feed = Feed.query.filter(Feed.uri == uri).first()

    if feed is not None:
        already_subscribed = bool(Subscription.query.filter(
            Subscription.user == current_user,
            Subscription.feed == feed).first())

        if already_subscribed:
            return res.already_exists()

    if feed is None:
        feed = Feed.from_parser(parser)

    subscription = Subscription(user=current_user, feed=feed)

    db.session.add(subscription)
    db.session.commit()

    return res.created(subscription.to_json())


@api.route("/subscriptions/<int:feed_id>/", methods=["GET"])
@login_required
def get_subscription(feed_id: int):
    subscription = Subscription.query.filter(
        Subscription.user == current_user,
        Subscription.feed_id == feed_id).first()

    if not subscription:
        return res.not_found()

    return res.ok(subscription.to_json())


@api.route("/subscriptions/<int:feed_id>/", methods=["DELETE"])
@login_required
def unsubscribe(feed_id: int):
    subscription = Subscription.query.filter(
        Subscription.user == current_user,
        Subscription.feed_id == feed_id).first()

    if not subscription:
        return res.not_found()

    db.session.delete(subscription)
    db.session.commit()

    return res.no_content()
