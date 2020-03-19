from flask import Blueprint, jsonify


bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/feeds")
def feeds():
    data = {"feeds": []}
    return jsonify(data)
