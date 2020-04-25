from flask_login import current_user  # type: ignore

from rss_reader.lib.models import SubscriptionEntry

from rss_reader.api import api, TReturnValue, api_response, login_required


@api.route("/articles/", methods=["GET"])
@api_response
@login_required
def list_all() -> TReturnValue:
    entries = SubscriptionEntry.query.filter_by(user_id=current_user.id).all()
    return [entry.to_json() for entry in entries], 200
