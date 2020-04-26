from flask import request
from flask_login import current_user  # type: ignore

from rss_reader.lib.models import db, SubscriptionCategory

from rss_reader.api import api, TReturnValue, api_response, login_required, \
    ClientError, ErrorType, MissingFieldError


@api.route("/categories/", methods=["POST"])
@api_response
@login_required
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
@api_response
@login_required
def list_categories() -> TReturnValue:
    categories = SubscriptionCategory.query.filter_by(
        user_id=current_user.id).all()
    return [category.to_json() for category in categories], 200


@api.route("/categories/<int:category_id>/", methods=["GET"])
@api_response
@login_required
def get_category(category_id: int) -> TReturnValue:
    category = SubscriptionCategory.query.filter_by(
        id=category_id, user_id=current_user.id).first()

    if not category:
        raise ClientError(ErrorType.NotFound)

    return category.to_json(), 200


@api.route("/categories/<int:category_id>/", methods=["PATCH"])
@api_response
@login_required
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
@api_response
@login_required
def delete_category(category_id: int) -> TReturnValue:
    category = SubscriptionCategory.query.filter_by(
        id=category_id, user_id=current_user.id).first()

    if not category:
        raise ClientError(ErrorType.NotFound)

    db.session.delete(category)
    db.session.commit()

    return None, 204
