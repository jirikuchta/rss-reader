from flask_login import current_user  # type: ignore

from rss_reader.lib.models import SubscriptionEntry

from rss_reader.api import api, TReturnValue, make_api_response, require_login


@api.route("/articles/", methods=["GET"])
@make_api_response
@require_login
def list_all() -> TReturnValue:
    entries = SubscriptionEntry.query.filter_by(user_id=current_user.id).all()
    return [entry.to_json() for entry in entries], 200
