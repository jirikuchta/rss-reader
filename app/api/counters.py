from sqlalchemy import func

from api import api_bp, TReturnValue, make_api_response
from models import Article


@api_bp.route("/counters/", methods=["GET"])
@make_api_response
def get_counters() -> TReturnValue:
    data = Article.query\
        .with_entities(Article.subscription_id, func.count())\
        .filter(Article.read.is_(False))\
        .group_by(Article.subscription_id).all()

    return dict((subscription_id, count)
                for subscription_id, count in data), 200
