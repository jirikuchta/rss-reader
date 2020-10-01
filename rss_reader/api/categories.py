from typing import List
from flask import request
from flask_login import current_user

from rss_reader.models import db, Category, Article, Subscription

from rss_reader.api import api, TReturnValue, make_api_response, \
    require_login, ClientError, ErrorType, MissingFieldError


def _get_category(category_id: int,
                  raise_if_not_found: bool = True) -> Category:
    category = Category.query.filter_by(
        id=category_id, user_id=current_user.id).first()

    if not category and raise_if_not_found:
        raise ClientError(ErrorType.NotFound)

    return category


def _get_category_subscriptions(category: Category) -> List[Subscription]:
    return Subscription.query.filter_by(category_id=category.id).all()


@api.route("/categories/", methods=["POST"])
@make_api_response
@require_login
def create_category() -> TReturnValue:
    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    title = request.json.get("title")

    if not title:
        raise MissingFieldError("title")

    if Category.query.filter_by(title=title, user_id=current_user.id).first():
        raise ClientError(ErrorType.AlreadyExists)

    category = Category(title=title, user_id=current_user.id)

    db.session.add(category)
    db.session.commit()

    return category.to_json(), 201


@api.route("/categories/", methods=["GET"])
@make_api_response
@require_login
def list_categories() -> TReturnValue:
    categories = Category.query.filter_by(
        user_id=current_user.id).all()
    return [category.to_json() for category in categories], 200


@api.route("/categories/<int:category_id>/", methods=["GET"])
@make_api_response
@require_login
def get_category(category_id: int) -> TReturnValue:
    return _get_category(category_id).to_json(), 200


@api.route("/categories/<int:category_id>/", methods=["PATCH"])
@make_api_response
@require_login
def update_category(category_id: int) -> TReturnValue:
    category = _get_category(category_id)

    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    title = request.json.get("title")

    if title and title != category.title:
        title_exists = Category.query.filter_by(
            title=title, user_id=current_user.id).first()
        if title_exists:
            raise ClientError(ErrorType.AlreadyExists)
        category.title = title

    db.session.commit()

    return category.to_json(), 200


@api.route("/categories/<int:category_id>/", methods=["DELETE"])
@make_api_response
@require_login
def delete_category(category_id: int) -> TReturnValue:
    category = _get_category(category_id)

    db.session.delete(category)
    db.session.commit()

    return None, 204


@api.route("/categories/<int:category_id>/articles/", methods=["GET"])
@make_api_response
@require_login
def list_category_articles(category_id: int) -> TReturnValue:
    category = _get_category(category_id)
    subscription_ids = [s.id for s in _get_category_subscriptions(category)]

    articles = Article.query.filter(
        Article.subscription_id.in_(subscription_ids)).all()

    return [article.to_json() for article in articles], 200


@api.route("/categories/<int:category_id>/read/", methods=["PUT"])
@make_api_response
@require_login
def mark_category_read(category_id: int) -> TReturnValue:
    category = _get_category(category_id)
    subscription_ids = [s.id for s in _get_category_subscriptions(category)]

    Article.query \
        .filter(Article.subscription_id.in_(subscription_ids)) \
        .update({Article.read: db.func.now()},
                synchronize_session=False)

    db.session.commit()

    return None, 204
