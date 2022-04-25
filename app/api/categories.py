from typing import List
from flask import request

from models import db, Category, Article, Subscription
from api import api_bp, TReturnValue, make_api_response, \
    ClientError, ErrorType, MissingFieldError


def get_category_or_raise(category_id: int) -> Category:
    category = Category.query.get(category_id)

    if not category:
        raise ClientError(ErrorType.NotFound)

    return category


def raise_for_duplicate_title(title: str) -> None:
    title_exists = Category.query.filter_by(title=title).first()
    if title_exists:
        raise ClientError(ErrorType.AlreadyExists)


def list_subscriptions(category: Category) -> List[Subscription]:
    return Subscription.query.filter_by(category_id=category.id).all()


@api_bp.route("/categories/", methods=["POST"])
@make_api_response
def create_category() -> TReturnValue:
    try:
        data = request.json
    except Exception:
        raise ClientError(ErrorType.BadRequest)

    title = data.get("title")
    if not title:
        raise MissingFieldError("title")

    raise_for_duplicate_title(title)

    category = Category(title=title)

    db.session.add(category)
    db.session.commit()

    return category.to_json(), 201


@api_bp.route("/categories/", methods=["GET"])
@make_api_response
def list_categories() -> TReturnValue:
    categories = Category.query.all()
    return [category.to_json() for category in categories], 200


@api_bp.route("/categories/<int:category_id>/", methods=["GET"])
@make_api_response
def get_category(category_id: int) -> TReturnValue:
    return get_category_or_raise(category_id).to_json(), 200


@api_bp.route("/categories/<int:category_id>/", methods=["PATCH"])
@make_api_response
def update_category(category_id: int) -> TReturnValue:
    try:
        data = request.json
    except Exception:
        raise ClientError(ErrorType.BadRequest)

    category = get_category_or_raise(category_id)

    title = data.get("title")

    if title and title != category.title:
        title_exists = Category.query.filter_by(title=title).first()
        if title_exists:
            raise ClientError(ErrorType.AlreadyExists)
        category.title = title

    db.session.commit()

    return category.to_json(), 200


@api_bp.route("/categories/<int:category_id>/", methods=["DELETE"])
@make_api_response
def delete_category(category_id: int) -> TReturnValue:
    category = get_category_or_raise(category_id)

    db.session.delete(category)
    db.session.commit()

    return None, 204


@api_bp.route("/categories/<int:category_id>/mark-read/", methods=["POST"])
@make_api_response
def mark_category_read(category_id: int) -> TReturnValue:
    category = get_category_or_raise(category_id)
    subscription_ids = [s.id for s in list_subscriptions(category)]

    Article.query \
        .filter(Article.subscription_id.in_(subscription_ids)) \
        .update({Article.read: True}, synchronize_session=False)

    db.session.commit()

    return None, 204
