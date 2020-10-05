from flask import request
from flask_login import current_user

from app.models import db, Article

from app.api import api, TReturnValue, make_api_response, \
    require_login, ClientError, ErrorType


def _get_article(article_id: int, raise_if_not_found: bool = True) -> Article:
    article = Article.query.filter_by(
        id=article_id, user_id=current_user.id).first()

    if not article and raise_if_not_found:
        raise ClientError(ErrorType.NotFound)

    return article


@api.route("/articles/", methods=["GET"])
@make_api_response
@require_login
def list_articles() -> TReturnValue:
    articles = Article.query.filter_by(
        user_id=current_user.id, time_read=None).all()
    return [article.to_json() for article in articles], 200


@api.route("/articles/<int:article_id>/", methods=["GET"])
@make_api_response
@require_login
def get_article(article_id: int) -> TReturnValue:
    return _get_article(article_id).to_json(), 200


@api.route("/articles/<int:article_id>/read/", methods=["PUT", "DELETE"])
@make_api_response
@require_login
def toggle_article_read(article_id: int) -> TReturnValue:
    article = _get_article(article_id)

    article.time_read = db.func.now() if request.method == "PUT" else None
    db.session.commit()

    return None, 204


@api.route("/articles/<int:article_id>/star/", methods=["PUT", "DELETE"])
@make_api_response
@require_login
def toggle_article_star(article_id: int) -> TReturnValue:
    article = _get_article(article_id)

    article.time_starred = db.func.now() if request.method == "PUT" else None
    db.session.commit()

    return None, 204
