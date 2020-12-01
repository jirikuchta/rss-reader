from flask import request

from rss_reader.models import db, Article

from rss_reader.api import api, TReturnValue, make_api_response, \
    ClientError, ErrorType


def get_article_or_raise(article_id: int) -> Article:
    article = Article.query.get(article_id)

    if not article:
        raise ClientError(ErrorType.NotFound)

    return article


@api.route("/articles/", methods=["GET"])
@make_api_response
def list_articles() -> TReturnValue:
    articles = Article.query\
        .filter_by(time_read=None)\
        .order_by(Article.time_published.desc()).all()
    return [article.to_json() for article in articles], 200


@api.route("/articles/<int:article_id>/", methods=["GET"])
@make_api_response
def get_article(article_id: int) -> TReturnValue:
    return get_article_or_raise(article_id).to_json(), 200


@api.route("/articles/<int:article_id>/read/", methods=["PUT", "DELETE"])
@make_api_response
def toggle_article_read(article_id: int) -> TReturnValue:
    article = get_article_or_raise(article_id)

    article.time_read = db.func.now() if request.method == "PUT" else None
    db.session.commit()

    return None, 204


@api.route("/articles/<int:article_id>/star/", methods=["PUT", "DELETE"])
@make_api_response
def toggle_article_star(article_id: int) -> TReturnValue:
    article = get_article_or_raise(article_id)

    article.time_starred = db.func.now() if request.method == "PUT" else None
    db.session.commit()

    return None, 204
