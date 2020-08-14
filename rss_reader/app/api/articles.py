from flask import request
from flask_login import current_user

from rss_reader.app.models import db, SubscriptionArticle

from rss_reader.app.api import api, TReturnValue, make_api_response, \
    require_login, ClientError, ErrorType


def _get_article_or_raise(article_id: int) -> SubscriptionArticle:
    article = SubscriptionArticle.query.filter_by(
        article_id=article_id, user_id=current_user.id).first()

    if not article:
        raise ClientError(ErrorType.NotFound)

    return article


@api.route("/articles/", methods=["GET"])
@make_api_response
@require_login
def list_articles() -> TReturnValue:
    articles = SubscriptionArticle.query.filter_by(
        user_id=current_user.id, read=None).all()
    return [article.to_json() for article in articles], 200


@api.route("/articles/<int:article_id>/", methods=["GET"])
@make_api_response
@require_login
def get_article(article_id: int) -> TReturnValue:
    return _get_article_or_raise(article_id).to_json(), 200


@api.route("/articles/<int:article_id>/read/", methods=["PUT", "DELETE"])
@make_api_response
@require_login
def toggle_article_read(article_id: int) -> TReturnValue:
    article = _get_article_or_raise(article_id)

    article.read = db.func.now() if request.method == "PUT" else None
    db.session.commit()

    return None, 204


@api.route("/articles/<int:article_id>/star/", methods=["PUT", "DELETE"])
@make_api_response
@require_login
def toggle_article_star(article_id: int) -> TReturnValue:
    article = _get_article_or_raise(article_id)

    article.starred = db.func.now() if request.method == "PUT" else None
    db.session.commit()

    return None, 204
