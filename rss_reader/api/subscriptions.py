from flask import request
from flask_login import current_user  # type: ignore

from rss_reader.lib.models import db, Feed, Subscription
from rss_reader.parser import parse

from rss_reader.api import api, TReturnValue, api_response, login_required, \
    ErrorType, ClientError, MissingFieldError


@api.route("/subscriptions/", methods=["GET"])
@api_response
@login_required
def list_subscriptions() -> TReturnValue:
    subscriptions = Subscription.query.filter(
        Subscription.user == current_user).all()
    return [subscription.to_json() for subscription in subscriptions], 200


@api.route("/subscriptions/", methods=["POST"])
@api_response
@login_required
def subscribe() -> TReturnValue:
    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    uri = request.json.get("uri")
    if not uri:
        raise MissingFieldError("uri")

    try:
        parser = parse(uri)
        uri = parser.link
    except Exception:
        raise ClientError(ErrorType.ParserError)

    feed = Feed.query.filter_by(uri=uri).first()

    if feed is not None:
        already_subscribed = bool(Subscription.query.filter_by(
            user=current_user, feed=feed).first())

        if already_subscribed:
            raise ClientError(ErrorType.AlreadyExists)

    if feed is None:
        feed = Feed.from_parser(parser)

    subscription = Subscription(user=current_user, feed=feed)

    db.session.add(subscription)
    db.session.commit()

    return subscription.to_json(), 201


@api.route("/subscriptions/<int:feed_id>/", methods=["GET"])
@api_response
@login_required
def get_subscription(feed_id: int) -> TReturnValue:
    subscription = Subscription.query.filter_by(
        user=current_user, feed_id=feed_id).first()

    if not subscription:
        raise ClientError(ErrorType.NotFound)

    return subscription.to_json(), 200


@api.route("/subscriptions/<int:feed_id>/", methods=["DELETE"])
@api_response
@login_required
def unsubscribe(feed_id: int) -> TReturnValue:
    subscription = Subscription.query.filter_by(
        user=current_user, feed_id=feed_id).first()

    if not subscription:
        raise ClientError(ErrorType.NotFound)

    db.session.delete(subscription)
    db.session.commit()

    return None, 204
