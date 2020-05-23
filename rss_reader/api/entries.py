from flask import request
from flask_login import current_user

from rss_reader.lib.models import db, SubscriptionEntry

from rss_reader.api import api, TReturnValue, make_api_response, \
    require_login, ClientError, ErrorType


def _get_entry_or_raise(entry_id: int) -> SubscriptionEntry:
    entry = SubscriptionEntry.query.filter_by(
        entry_id=entry_id, user_id=current_user.id).first()

    if not entry:
        raise ClientError(ErrorType.NotFound)

    return entry


@api.route("/entries/", methods=["GET"])
@make_api_response
@require_login
def list_entries() -> TReturnValue:
    entries = SubscriptionEntry.query.filter_by(
        user_id=current_user.id, read=None).all()
    return [entry.to_json() for entry in entries], 200


@api.route("/entries/<int:entry_id>/", methods=["GET"])
@make_api_response
@require_login
def get_entry(entry_id: int) -> TReturnValue:
    return _get_entry_or_raise(entry_id).to_json(), 200


@api.route("/entries/<int:entry_id>/read/", methods=["PUT", "DELETE"])
@make_api_response
@require_login
def toggle_entry_read(entry_id: int) -> TReturnValue:
    entry = _get_entry_or_raise(entry_id)

    entry.read = db.func.now() if request.method == "PUT" else None
    db.session.commit()

    return None, 204


@api.route("/entries/<int:entry_id>/star/", methods=["PUT", "DELETE"])
@make_api_response
@require_login
def toggle_entry_star(entry_id: int) -> TReturnValue:
    entry = _get_entry_or_raise(entry_id)

    entry.starred = db.func.now() if request.method == "PUT" else None
    db.session.commit()

    return None, 204
