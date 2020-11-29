import json
from datetime import datetime
from typing import TypedDict

from flask import current_app as app

from rss_reader.parser import parse
from rss_reader.models import db, Subscription, Article


class Result(TypedDict):
    new_articles_count: int
    updated_articles_count: int
    skipped_articles_count: int


def update_subscription(subscription: Subscription) -> Result:
    app.logger.info("Updating subscription: %s", subscription)

    result: Result = {
        "new_articles_count": 0,
        "updated_articles_count": 0,
        "skipped_articles_count": 0
    }

    parser = parse(subscription.feed_url)
    articles = Article.query.filter(
        Article.subscription_id == subscription.id).all()

    for item in parser.items:
        article = next(filter(lambda a: a.guid == item.guid, articles), None)

        if article:
            if article.hash == item.hash:
                app.logger.info("Skipping existing article %s", item.guid)
            else:
                app.logger.info("Updating article %s", item.guid)
                article.update(item)
                app.logger.debug("Article updated: %s", article)
        else:
            app.logger.info("Creating new article %s", item.guid)
            db.session.add(Article.from_parser(
                item,
                subscription_id=subscription.id, user_id=subscription.user_id))
            app.logger.debug("Article created: %s", article)

    subscription.time_updated = datetime.now()

    db.session.commit()

    app.logger.info("Subscription updated: %s", subscription)
    app.logger.debug("Subscription updated: %s", json.dumps(result))

    return result
