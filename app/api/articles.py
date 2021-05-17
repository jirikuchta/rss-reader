from flask import request

from models import db, Article, Subscription
from api import api_bp, TReturnValue, make_api_response, \
    ClientError, ErrorType


def get_article_or_raise(article_id: int) -> Article:
    article = Article.query.get(article_id)

    if not article:
        raise ClientError(ErrorType.NotFound)

    return article


@api_bp.route("/articles/", methods=["GET"])
@make_api_response
def list_articles() -> TReturnValue:
    subscription_id = request.args.get("subscription_id")
    category_id = request.args.get("category_id")
    starred_only = "starred_only" in request.args
    unread_only = "unread_only" in request.args
    limit = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))

    filters = []

    if subscription_id is not None:
        filters.append(Article.subscription_id == int(subscription_id))

    if category_id is not None and subscription_id is None:
        subscriptions_query = db.session.query(Subscription.id).filter(
            Subscription.category_id == category_id)
        filters.append(Article.subscription_id.in_(subscriptions_query))

    if starred_only:
        filters.append(Article.starred.is_(True))

    if unread_only:
        filters.append(Article.read.is_(False))

    articles = Article.query\
        .filter(*filters)\
        .order_by(Article.time_published.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()

    return [article.to_json() for article in articles], 200


@api_bp.route("/articles/<int:article_id>/", methods=["GET"])
@make_api_response
def get_article(article_id: int) -> TReturnValue:
    return get_article_or_raise(article_id).to_json(), 200


@api_bp.route("/articles/<int:article_id>/", methods=["PATCH"])
@make_api_response
def update_article(article_id: int) -> TReturnValue:
    article = get_article_or_raise(article_id)

    if "starred" in request.json:
        article.starred = bool(request.json["starred"])

    if "read" in request.json:
        article.read = bool(request.json["read"])

    db.session.commit()

    return article.to_json(), 200


@api_bp.route("/articles/mark-read/", methods=["POST"])
@make_api_response
def mark_articles_read() -> TReturnValue:
    Article.query \
        .filter(Article.id.in_(request.json.get("ids", []))) \
        .update({Article.read: True}, synchronize_session=False)

    db.session.commit()

    return None, 204
