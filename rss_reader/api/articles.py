from flask import Response
from flask_login import current_user  # type: ignore

from rss_reader.lib.models import SubscriptionEntry

import rss_reader.api.response as res
from rss_reader.api import api, login_required


@api.route("/articles/", methods=["GET"])
@login_required
def list_all() -> Response:
    entries = SubscriptionEntry.query.filter_by(user_id=current_user.id).all()
    return res.ok([entry.to_json() for entry in entries])
