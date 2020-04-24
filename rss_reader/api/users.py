from flask import request, Response
from flask_login import current_user  # type: ignore

from rss_reader.lib.models import db, User, UserRole

import rss_reader.api.response as res
from rss_reader.api import api, login_required, admin_role_required


@api.route("/users/", methods=["GET"])
@admin_role_required
def list_users():
    return res.ok([user.to_json() for user in User.query.all()])


@api.route("/users/", methods=["POST"])
@admin_role_required
def create_user() -> Response:
    if request.json is None:
        return res.bad_request()

    username = request.json.get("username")
    password = request.json.get("password")
    role = request.json.get("role")

    if not username:
        return res.missing_field("username")

    if not password:
        return res.missing_field("password")

    if role:
        try:
            role = UserRole[role]
        except KeyError:
            return res.invalid_field("role")

    if User.query.filter_by(username=username).first():
        return res.already_exists()

    user = User(username=username, password=password, role=role)

    db.session.add(user)
    db.session.commit()

    return res.created(user.to_json())


@api.route("/users/<int:user_id>/", methods=["PATCH"])
@login_required
def update_user(user_id: int) -> Response:
    username = request.json.get("username")
    password = request.json.get("password")
    role = request.json.get("role")

    user = User.query.get(user_id)

    if not user:
        return res.not_found()

    if username:
        if User.query.filter_by(username=username).first():
            return res.already_exists()
        user.username = username

    if password:
        user.password = password

    if role:
        try:
            role = UserRole[role]
        except KeyError:
            return res.invalid_field("role")

        if user.role is UserRole.admin and role is not UserRole.admin:
            last_admin = User.query.filter_by(role=UserRole.admin).count() == 1
            if last_admin:
                return res.forbidden()  # TODO: reason

        user.role = role

    db.session.commit()

    return res.ok(user.to_json())


@api.route("/users/<int:user_id>/", methods=["DELETE"])
@login_required
def delete_user(user_id: int) -> Response:
    if current_user.role is not UserRole.admin:
        if current_user.id != user_id:
            return res.forbidden()

    user = User.query.get(user_id)

    if not user:
        return res.not_found()

    if user.role is UserRole.admin:
        last_admin = User.query.filter_by(role=UserRole.admin).count() == 1
        if last_admin:
            return res.forbidden()  # TODO: reason

    db.session.delete(user)
    db.session.commit()

    return res.no_content()


@api.route("/users/current/", methods=["GET"])
@login_required
def get_current_user() -> Response:
    return res.ok(current_user.to_json())
