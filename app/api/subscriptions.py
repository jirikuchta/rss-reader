from typing import Optional
from flask import request, current_app as app

from models import db, Subscription, Category, Article
from api import api_bp, TReturnValue, make_api_response, ErrorType, \
    ClientError, MissingFieldError, InvalidFieldError
from lib.feedparser import parse, AmbiguousFeedUrl
from lib.updatefeed import update_subscription as update_subscription_articles


def get_subscription_or_raise(subscription_id: int) -> Subscription:
    subscription = Subscription.query.get(subscription_id)

    if not subscription:
        raise ClientError(ErrorType.NotFound)

    return subscription


def raise_for_invalid_category_id(category_id: Optional[int]) -> None:
    if category_id is not None:
        if Category.query.get(category_id) is None:
            raise InvalidFieldError("category_id", msg="category not found")


@api_bp.route("/subscriptions/", methods=["POST"])
@make_api_response
def create_subscription() -> TReturnValue:
    data = request.get_json(silent=True)

    if data is None:
        raise ClientError(ErrorType.BadRequest)

    feed_url = data.get("feed_url")
    if not feed_url:
        raise MissingFieldError("feed_url")

    category_id = data.get("category_id")
    raise_for_invalid_category_id(category_id)

    try:
        parser = parse(feed_url)
    except AmbiguousFeedUrl as e:
        raise ClientError(ErrorType.AmbiguousFeedUrl, links=e.feed_links)
    except Exception:
        raise ClientError(ErrorType.ParserError)

    already_subscribed = bool(Subscription.query.filter_by(
        feed_url=feed_url).first())
    if already_subscribed:
        raise ClientError(ErrorType.AlreadyExists)

    subscription = Subscription.from_parser(parser, category_id=category_id)

    db.session.add(subscription)
    db.session.flush()

    app.logger.info(f"{subscription} created")
    app.logger.debug(repr(subscription))

    subscription.hash = ""
    update_subscription_articles(subscription, purge=False)

    return subscription.to_json(), 201


@api_bp.route("/subscriptions/", methods=["GET"])
@make_api_response
def list_subscriptions() -> TReturnValue:
    subscriptions = Subscription.query.all()
    return [subscription.to_json() for subscription in subscriptions], 200


@api_bp.route("/subscriptions/<int:subscription_id>/", methods=["GET"])
@make_api_response
def get_subscription(subscription_id: int) -> TReturnValue:
    return get_subscription_or_raise(subscription_id).to_json(), 200


@api_bp.route("/subscriptions/<int:subscription_id>/", methods=["PATCH"])
@make_api_response
def update_subscription(subscription_id: int) -> TReturnValue:
    subscription = get_subscription_or_raise(subscription_id)

    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    title = request.json.get("title")
    if title is not None:
        if title == "":
            raise MissingFieldError("title")
        subscription.title = title

    feed_url = request.json.get("feed_url")
    if feed_url is not None:
        try:
            parser = parse(feed_url)
        except AmbiguousFeedUrl as e:
            raise ClientError(ErrorType.AmbiguousFeedUrl, links=e.feed_links)
        except Exception:
            raise ClientError(ErrorType.ParserError)
        subscription.feed_url = parser.feed_url

    category_id = request.json.get("category_id")
    if category_id is not None:
        raise_for_invalid_category_id(category_id)
        subscription.category_id = category_id

    favorite = request.json.get("favorite")
    if favorite is not None:
        if type(favorite) is not bool:
            raise InvalidFieldError("favorite")
        subscription.favorite = favorite

    db.session.commit()

    return subscription.to_json(), 200


@api_bp.route("/subscriptions/<int:subscription_id>/", methods=["DELETE"])
@make_api_response
def delete_subscription(subscription_id: int) -> TReturnValue:
    subscription = get_subscription_or_raise(subscription_id)

    db.session.delete(subscription)
    db.session.commit()

    return None, 204


@api_bp.route("/subscriptions/<int:subscription_id>/mark-read/", methods=["POST"])
@make_api_response
def mark_subscription_read(subscription_id: int) -> TReturnValue:
    subscription = get_subscription_or_raise(subscription_id)

    Article.query \
        .filter_by(subscription_id=subscription.id) \
        .update({Article.read: True}, synchronize_session=False)

    db.session.commit()

    return None, 204
