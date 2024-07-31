import subprocess
import json

from flask import request
from readability import Document

from models import db, Article, Subscription
from api import api_bp, TReturnValue, make_api_response, \
    ClientError, ErrorType
from lib.utils import http_request


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
    bookmarked_only = request.args.get("bookmarked_only") == "true"
    unread_only = request.args.get("unread_only") == "true"
    sort_by = request.args.get("sort_by", "time_published")
    order = request.args.get("order", "desc")
    limit = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))

    filters = []

    if subscription_id is not None:
        filters.append(Article.subscription_id == int(subscription_id))

    if category_id is not None and subscription_id is None:
        subscriptions_query = db.session.query(Subscription.id).filter(
            Subscription.category_id == category_id)
        filters.append(Article.subscription_id.in_(subscriptions_query))

    if bookmarked_only:
        filters.append(Article.bookmarked.is_(True))

    if unread_only:
        filters.append(Article.read.is_(False))

    articles = Article.query\
        .filter(*filters)\
        .order_by(getattr(getattr(Article, sort_by), order)())\
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

    if "bookmarked" in request.json:
        article.bookmarked = bool(request.json["bookmarked"])

    if "read" in request.json:
        article.read = bool(request.json["read"])

    db.session.commit()

    return article.to_json(), 200


@api_bp.route("/articles/mark-read/", methods=["POST"])
@make_api_response
def mark_articles_read() -> TReturnValue:
    if request.json.get("all", False):
        Article.query.update({Article.read: True})
    else:
        Article.query \
            .filter(Article.id.in_(request.json.get("ids", []))) \
            .update({Article.read: True}, synchronize_session=False)

    db.session.commit()

    return None, 204


@api_bp.route("/articles/full-content/<int:article_id>/", methods=["GET"])
@make_api_response
def get_full_content(article_id: int) -> TReturnValue:
    article = get_article_or_raise(article_id)
    with http_request(article.url) as res:
        doc = Document(res.read().decode(
            res.headers.get_content_charset("utf-8")))
    return {"content": doc.summary()}, 200
