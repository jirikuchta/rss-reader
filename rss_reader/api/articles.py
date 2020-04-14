from flask import request
from flask_login import current_user

from rss_reader.lib.models import db, SubscriptionEntry

import rss_reader.api.response as res
from rss_reader.api import api, login_required


@api.route("/articles/", methods=["GET"])
@login_required
def list_all():
    entries = SubscriptionEntry.query.filter(
        SubscriptionEntry.user_id == current_user.id).all()
    return res.ok([entry.to_json() for entry in entries])
