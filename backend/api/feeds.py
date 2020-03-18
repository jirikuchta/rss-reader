from flask import jsonify

from backend.api import bp
from backend.model.feed import Feed


@bp.route("/feeds")
def feeds():
    print(">>>>>>>>>>>>>>>>>>>>>>>>>>>>")
    data = {"feeds": Feed.query_all()}
    return jsonify(data)
