from flask import request
from flask_login import current_user

from rss_reader.lib.models import db, Feed, FeedEntry, Subscription, \
    SubscriptionEntry
from rss_reader.parser import parse

import rss_reader.api.response as res
from rss_reader.api import api, login_required


@api.route("/subscriptions/", methods=["GET"])
@login_required
def list_subscriptions():
    subscriptions = Subscription.query.filter(
        Subscription.user_id == current_user.id).all()
    return res.ok([subscription.to_json() for subscription in subscriptions])


@api.route("/subscriptions/", methods=["POST"])
@login_required
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
        entries=[SubscriptionEntry(
            user_id=current_user.id,
            feed_entry=entry) for entry in feed.entries])

    db.session.add(subscription)
    db.session.commit()

    return res.created(subscription.to_json())


@api.route("/subscriptions/<int:feed_id>/", methods=["GET"])
@login_required
def get_subscription(feed_id: int):
    subscription = Subscription.query.filter(
        Subscription.user_id == current_user.id,
        Subscription.feed_id == feed_id).first()

    if not subscription:
        return (None, "not_found")

    return res.ok(subscription.to_json())


@api.route("/subscriptions/<int:feed_id>/", methods=["DELETE"])
@login_required
def unsubscribe(feed_id: int):
    subscription = Subscription.query.filter(
        Subscription.user_id == current_user.id,
        Subscription.feed_id == feed_id).first()

    if not subscription:
        return res.not_found()

    db.session.delete(subscription)
    db.session.commit()

    return res.no_content()


@api.route("/subscriptions/<int:feed_id>/entries/", methods=["GET"])
@login_required
def list_subscription_entries(feed_id: int):
    subscription = Subscription.query.filter(
        Subscription.user_id == current_user.id,
        Subscription.feed_id == feed_id).first()

    if not subscription:
        return res.not_found()

    return res.ok([entry.to_json() for entry in subscription.entries])


@api.route("/subscriptions/entries/", methods=["GET"])
@login_required
def list_all_entries():
    entries = SubscriptionEntry.query.filter(
        SubscriptionEntry.user_id == current_user.id).all()

    return res.ok([entry.to_json() for entry in entries])
