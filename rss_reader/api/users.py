from flask import request
from flask_login import current_user  # type: ignore

from rss_reader.models import db, User

from rss_reader.api import api, TReturnValue, make_api_response, \
    require_login, ClientError, ErrorType


@api.route("/users/", methods=["PATCH"])
@make_api_response
@require_login
def update_user() -> TReturnValue:
    if request.json is None:
        raise ClientError(ErrorType.BadRequest)

    username = request.json.get("username")
    password = request.json.get("password")

    if username:
        if User.query.filter_by(username=username).first():
            raise ClientError(ErrorType.AlreadyExists)
        current_user.username = username

    if password:
        current_user.set_password(password)

    db.session.commit()

    return current_user.to_json(), 200


@api.route("/users/", methods=["DELETE"])
@make_api_response
@require_login
def delete_user() -> TReturnValue:
    db.session.delete(current_user)
    db.session.commit()
    return None, 204
