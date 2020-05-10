from flask_login import current_user  # type: ignore

from rss_reader.api import api, TReturnValue, make_api_response, require_login
from rss_reader.lib.models import SubscriptionEntry


@api.route("/entries/", methods=["GET"])
@make_api_response
@require_login
def list_entries() -> TReturnValue:
    entries = SubscriptionEntry.query.filter_by(user_id=current_user.id).all()
    return [entry.to_json() for entry in entries], 200


@api.route("/entries/<int:entry_id>/read/", methods=["GET"])
@make_api_response
@require_login
def set_entry_read_flag(entry_id: int) -> TReturnValue:
    pass


@api.route("/entries/<int:entry_id>/unread/", methods=["PUT"])
@make_api_response
@require_login
def unset_entry_read_flag(entry_id: int) -> TReturnValue:
    pass


@api.route("/entries/<int:entry_id>/star/", methods=["PUT"])
@make_api_response
@require_login
def set_entry_star_flag(entry_id: int) -> TReturnValue:
    pass


@api.route("/entries/<int:entry_id>/unstar/", methods=["PUT"])
@make_api_response
@require_login
def unset_entry_star_flag(entry_id: int) -> TReturnValue:
    pass
