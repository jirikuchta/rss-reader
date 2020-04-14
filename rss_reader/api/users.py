from flask import request

from rss_reader.lib.models import db, User, UserRoles
from rss_reader.parser import parse

import rss_reader.api.response as res
from rss_reader.api import api, admin_role_required


@api.route("/users/", methods=["GET"])
@admin_role_required
def list_users():
    return res.ok([user.to_json() for user in User.query.all()])


@api.route("/users/", methods=["POST"])
@admin_role_required
def create_user():
    username = request.form.get("username")
    password = request.form.get("password")
    role = request.form.get("role")

    if not username:
        return res.missing_field("username")

    if not password:
        return res.missing_field("password")

    if role:
        try:
            role = UserRoles[role]
        except KeyError:
            return res.invalid_field("role")

    if db.session.query(User).filter(User.username == username).first():
        return res.already_exists()

    user = User(username=username, password=password, role=role)

    db.session.add(user)
    db.session.commit()

    return res.created(user.to_json())
