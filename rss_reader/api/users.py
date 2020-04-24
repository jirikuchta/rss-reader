from flask import request, Response
from flask_login import current_user

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

    if db.session.query(User).filter(User.username == username).first():
        return res.already_exists()

    user = User(username=username, password=password, role=role)

    db.session.add(user)
    db.session.commit()

    return res.created(user.to_json())


@api.route("/users/<int:user_id>/", methods=["PATCH"])
@login_required
def update_user(user_id: int) -> Response:
    pass


@api.route("/users/<int:user_id>/", methods=["DELETE"])
@login_required
def delete_user(user_id: int) -> Response:
    if current_user.role is not UserRole.admin:
        if current_user.id != user_id:
            return res.forbidden()

    user = db.session.query(User).get(user_id)

    if not user:
        return res.not_found()

    db.session.delete(user)
    db.session.commit()

    return res.no_content()


@api.route("/users/current/", methods=["GET"])
@login_required
def get_current_user() -> Response:
    return res.ok(current_user.to_json())
