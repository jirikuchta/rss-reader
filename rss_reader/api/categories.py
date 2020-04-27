from flask import request
from flask_login import current_user  # type: ignore

from rss_reader.lib.models import db, SubscriptionCategory

from rss_reader.api import api, TReturnValue, make_api_response, \
    require_login, ClientError, ErrorType, MissingFieldError


@api.route("/categories/", methods=["POST"])
@make_api_response
@require_login
def create_category() -> TReturnValue:
    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    title = request.json.get("title")

    if not title:
        raise MissingFieldError("title")

    if SubscriptionCategory.query.filter_by(
            title=title, user_id=current_user.id).first():
        raise ClientError(ErrorType.AlreadyExists)

    category = SubscriptionCategory(title=title, user_id=current_user.id)

    db.session.add(category)
    db.session.commit()

    return category.to_json(), 201


@api.route("/categories/", methods=["GET"])
@make_api_response
@require_login
def list_categories() -> TReturnValue:
    categories = SubscriptionCategory.query.filter_by(
        user_id=current_user.id).all()
    return [category.to_json() for category in categories], 200


@api.route("/categories/<int:category_id>/", methods=["GET"])
@make_api_response
@require_login
def get_category(category_id: int) -> TReturnValue:
    category = SubscriptionCategory.query.filter_by(
        id=category_id, user_id=current_user.id).first()

    if not category:
        raise ClientError(ErrorType.NotFound)

    return category.to_json(), 200


@api.route("/categories/<int:category_id>/", methods=["PATCH"])
@make_api_response
@require_login
def update_category(category_id: int) -> TReturnValue:
    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    category = SubscriptionCategory.query.filter_by(
        id=category_id, user_id=current_user.id).first()

    if not category:
        raise ClientError(ErrorType.NotFound)

    title = request.json.get("title")

    if title and title != category.title:
        title_exists = SubscriptionCategory.query.filter_by(
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
    category = SubscriptionCategory.query.filter_by(
        id=category_id, user_id=current_user.id).first()

    if not category:
        raise ClientError(ErrorType.NotFound)

    db.session.delete(category)
    db.session.commit()

    return None, 204
