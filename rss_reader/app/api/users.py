from flask import request
from flask_login import current_user

from app.models import db, User, UserRole

from app.api import api, TReturnValue, make_api_response, \
    require_login, require_admin_user, ClientError, ErrorType, \
    MissingFieldError, InvalidFieldError


@api.route("/users/", methods=["GET"])
@make_api_response
@require_admin_user
def list_users() -> TReturnValue:
    return [user.to_json() for user in User.query.all()], 200


@api.route("/users/", methods=["POST"])
@make_api_response
@require_admin_user
def create_user() -> TReturnValue:
    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    username = request.json.get("username")
    password = request.json.get("password")
    role = request.json.get("role")

    if not username:
        raise MissingFieldError("username")

    if not password:
        raise MissingFieldError("password")

    if role:
        try:
            role = UserRole[role]
        except KeyError:
            raise InvalidFieldError("role")

    if User.query.filter_by(username=username).first():
        raise ClientError(ErrorType.AlreadyExists)

    user = User(username=username, password=password, role=role)

    db.session.add(user)
    db.session.commit()

    return user.to_json(), 201


@api.route("/users/<int:user_id>/", methods=["PATCH"])
@make_api_response
@require_login
def update_user(user_id: int) -> TReturnValue:
    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    username = request.json.get("username")
    password = request.json.get("password")
    role = request.json.get("role")

    user = User.query.get(user_id)

    if not user:
        raise ClientError(ErrorType.NotFound)

    if username:
        if User.query.filter_by(username=username).first():
            raise ClientError(ErrorType.AlreadyExists)
        user.username = username

    if password:
        user.password = password

    if role:
        try:
            role = UserRole[role]
        except KeyError:
            raise InvalidFieldError("role")

        if user.role is UserRole.user and role is not UserRole.user:
            raise ClientError(ErrorType.Forbidden)

        if user.role is UserRole.admin and role is not UserRole.admin:
            last_admin = User.query.filter_by(role=UserRole.admin).count() == 1
            if last_admin:
                raise ClientError(ErrorType.LastAdmin)

        user.role = role

    db.session.commit()

    return user.to_json(), 200


@api.route("/users/<int:user_id>/", methods=["DELETE"])
@make_api_response
@require_login
def delete_user(user_id: int) -> TReturnValue:
    if current_user.role is not UserRole.admin:
        if current_user.id != user_id:
            raise ClientError(ErrorType.Forbidden)

    user = User.query.get(user_id)

    if not user:
        raise ClientError(ErrorType.NotFound)

    if user.role is UserRole.admin:
        last_admin = User.query.filter_by(role=UserRole.admin).count() == 1
        if last_admin:
            raise ClientError(ErrorType.LastAdmin)

    db.session.delete(user)
    db.session.commit()

    return None, 204


@api.route("/users/current/", methods=["GET"])
@make_api_response
@require_login
def get_current_user() -> TReturnValue:
    return current_user.to_json(), 200
