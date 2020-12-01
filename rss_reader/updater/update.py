import json
from datetime import datetime
from typing import TypedDict

from flask import current_app as app

from rss_reader.parser import parse
from rss_reader.models import db, Subscription, Article


class Result(TypedDict):
    new_items: int
    updated_items: int
    skipped_items: int


def update_subscription(subscription: Subscription) -> Result:
    app.logger.info("Updating subscription: %s", subscription)
    app.logger.debug(repr(subscription))

    result: Result = {
        "new_items": 0,
        "updated_items": 0,
        "skipped_items": 0
    }

    parser = parse(subscription.feed_url)
    articles = Article.query.filter(
        Article.subscription_id == subscription.id).all()

    for item in parser.items:
        app.logger.info("Processing feed item: %s", item)
        app.logger.debug(repr(item))

        article = next(filter(lambda a: a.guid == item.guid, articles), None)

        if article:
            app.logger.info("Matching article found: %s", article)
            app.logger.debug(repr(article))

            if article.hash == item.hash:
                app.logger.info("Article is up-to-date, nothing to be done.")
                result["skipped_items"] += 1
            else:
                app.logger.info("Feed item has changed, updating article.")

                article.update(item)

                app.logger.info("Article updated: %s", article)
                app.logger.debug(repr(article))

                result["updated_items"] += 1
        else:
            app.logger.info("No matching article found, creating new one.")

            article = Article.from_parser(
                item, subscription_id=subscription.id)

            db.session.add(article)
            db.session.flush()

            app.logger.info("Article created: %s", article)
            app.logger.debug(repr(article))

            result["new_items"] += 1

    subscription.time_updated = datetime.now()

    db.session.commit()

    app.logger.info("Subscription updated: %s", subscription)
    app.logger.debug(json.dumps(result))

    return result
