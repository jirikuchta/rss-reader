from flask import request
from flask_login import current_user

from rss_reader.models import db, Subscription, Category, Article
from rss_reader.parser import parse

from rss_reader.api import api, TReturnValue, make_api_response, \
    require_login, ErrorType, ClientError, MissingFieldError, InvalidFieldError


def _get_subscription_or_raise(subscription_id: int) -> Subscription:
    subscription = Subscription.query.filter_by(
        id=subscription_id, user_id=current_user.id).first()

    if not subscription:
        raise ClientError(ErrorType.NotFound)

    return subscription


@api.route("/subscriptions/", methods=["POST"])
@make_api_response
@require_login
def create_subscription() -> TReturnValue:
    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    feed_url = request.json.get("feed_url")
    if not feed_url:
        raise MissingFieldError("feed_url")

    try:
        parser = parse(feed_url)
        feed_url = parser.link
    except Exception:
        raise ClientError(ErrorType.ParserError)

    already_subscribed = bool(Subscription.query.filter_by(
        feed_url=feed_url, user_id=current_user.id).first())
    if already_subscribed:
        raise ClientError(ErrorType.AlreadyExists)

    category_id = request.json.get("category_id")
    if category_id:
        category_exists = bool(Category.query.filter_by(
            id=category_id, user_id=current_user.id).first())
        if not category_exists:
            raise InvalidFieldError("category_id", msg=f"category not found")

    subscription = Subscription.from_parser(parser, current_user.id)
    subscription.user = current_user
    subscription.category_id = category_id
    db.session.add(subscription)
    db.session.flush()

    for item in parser.items:
        db.session.add(
            Article.from_parser(item, subscription.id, current_user.id))

    db.session.commit()

    return subscription.to_json(), 201


@api.route("/subscriptions/", methods=["GET"])
@make_api_response
@require_login
def list_subscriptions() -> TReturnValue:
    subscriptions = Subscription.query.filter(
        Subscription.user_id == current_user.id).all()
    return [subscription.to_json() for subscription in subscriptions], 200


@api.route("/subscriptions/<int:subscription_id>/", methods=["GET"])
@make_api_response
@require_login
def get_subscription(subscription_id: int) -> TReturnValue:
    return _get_subscription_or_raise(subscription_id).to_json(), 200


@api.route("/subscriptions/<int:subscription_id>/", methods=["PATCH"])
@make_api_response
@require_login
def update_subscription(subscription_id: int) -> TReturnValue:
    subscription = _get_subscription_or_raise(subscription_id)

    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    title = request.json.get("title")
    if title == "":
        raise MissingFieldError("title")
    if title:
        subscription.title = title

    category_id = request.json.get("category_id")
    subscription.category_id = category_id

    if category_id is not None:
        if not Category.query.filter_by(
                id=category_id, user_id=current_user.id).first():
            raise InvalidFieldError("category_id", msg=f"category not found")

    db.session.commit()

    return subscription.to_json(), 200


@api.route("/subscriptions/<int:subscription_id>/", methods=["DELETE"])
@make_api_response
@require_login
def delete_subscription(subscription_id: int) -> TReturnValue:
    subscription = _get_subscription_or_raise(subscription_id)

    db.session.delete(subscription)
    db.session.commit()

    return None, 204


@api.route("/subscriptions/<int:subscription_id>/articles/", methods=["GET"])
@make_api_response
@require_login
def list_subscription_articles(subscription_id: int) -> TReturnValue:
    subscription = _get_subscription_or_raise(subscription_id)
    articles = Article.query.filter_by(
        subscription_id=subscription.id).all()
    return [article.to_json() for article in articles], 200


@api.route("/subscriptions/<int:subscription_id>/read/", methods=["PUT"])
@make_api_response
@require_login
def mark_subscription_read(subscription_id: int) -> TReturnValue:
    subscription = _get_subscription_or_raise(subscription_id)

    Article.query \
        .filter_by(subscription_id=subscription.id) \
        .update({Article.read: db.func.now()},
                synchronize_session=False)

    db.session.commit()

    return None, 204
