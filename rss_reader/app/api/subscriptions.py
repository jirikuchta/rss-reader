from flask import request
from flask_login import current_user

from rss_reader.app.models import db, Feed, Subscription, \
    SubscriptionCategory, SubscriptionArticle
from rss_reader.app.parser import parse

from rss_reader.app.api import api, TReturnValue, make_api_response, \
    require_login, ErrorType, ClientError, MissingFieldError, InvalidFieldError


def _get_subscription_or_raise(feed_id: int) -> Subscription:
    subscription = Subscription.query.filter_by(
        user=current_user, feed_id=feed_id).first()

    if not subscription:
        raise ClientError(ErrorType.NotFound)

    return subscription


@api.route("/subscriptions/", methods=["POST"])
@make_api_response
@require_login
def create_subscription() -> TReturnValue:
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

    category_id = request.json.get("categoryId")
    if category_id:
        if not SubscriptionCategory.query.filter_by(
                id=category_id, user_id=current_user.id).first():
            raise InvalidFieldError("categoryId", msg=f"category not found")

    subscription = Subscription(
        user=current_user,
        feed=feed,
        category_id=category_id)

    db.session.add(subscription)
    db.session.commit()

    return subscription.to_json(), 201


@api.route("/subscriptions/", methods=["GET"])
@make_api_response
@require_login
def list_subscriptions() -> TReturnValue:
    subscriptions = Subscription.query.filter(
        Subscription.user == current_user).all()
    return [subscription.to_json() for subscription in subscriptions], 200


@api.route("/subscriptions/<int:feed_id>/", methods=["GET"])
@make_api_response
@require_login
def get_subscription(feed_id: int) -> TReturnValue:
    return _get_subscription_or_raise(feed_id).to_json(), 200


@api.route("/subscriptions/<int:feed_id>/", methods=["PATCH"])
@make_api_response
@require_login
def update_subscription(feed_id: int) -> TReturnValue:
    subscription = _get_subscription_or_raise(feed_id)

    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    title = request.json.get("title")
    if title == "":
        raise MissingFieldError("title")
    if title:
        subscription.title = title

    category_id = request.json.get("categoryId")
    subscription.category_id = category_id
    if category_id:
        if not SubscriptionCategory.query.filter_by(
                id=category_id, user_id=current_user.id).first():
            raise InvalidFieldError("categoryId", msg=f"category not found")

    db.session.commit()

    return subscription.to_json(), 200


@api.route("/subscriptions/<int:feed_id>/", methods=["DELETE"])
@make_api_response
@require_login
def delete_subscription(feed_id: int) -> TReturnValue:
    subscription = _get_subscription_or_raise(feed_id)

    db.session.delete(subscription)
    db.session.commit()

    return None, 204


@api.route("/subscriptions/<int:feed_id>/articles/", methods=["GET"])
@make_api_response
@require_login
def list_subscription_articles(feed_id: int) -> TReturnValue:
    subscription = _get_subscription_or_raise(feed_id)
    articles = SubscriptionArticle.query.filter_by(
        subscription=subscription).all()
    return [article.to_json() for article in articles], 200


@api.route("/subscriptions/<int:feed_id>/read/", methods=["PUT"])
@make_api_response
@require_login
def mark_subscription_read(feed_id: int) -> TReturnValue:
    subscription = _get_subscription_or_raise(feed_id)

    SubscriptionArticle.query \
        .filter_by(subscription=subscription) \
        .update({SubscriptionArticle.read: db.func.now()},
                synchronize_session=False)

    db.session.commit()

    return None, 204
