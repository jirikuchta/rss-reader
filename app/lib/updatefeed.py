import json
from datetime import datetime
from typing import TypedDict
from flask import current_app as app

from models import db, Subscription, Article
from lib.feedparser import parse


class Result(TypedDict):
    created: int
    updated: int
    skipped: int


def update_subscription(subscription: Subscription) -> Result:
    app.logger.info(f"Updating {subscription}")
    app.logger.debug(repr(subscription))

    result: Result = {
        "created": 0,
        "updated": 0,
        "skipped": 0
    }

    parser = parse(subscription.feed_url)

    if subscription.hash == parser.hash:
        app.logger.info(f"{subscription} is up-to-date.")
        result["skipped"] = len(parser.items)
        return result

    articles = Article.query.filter(
        Article.subscription_id == subscription.id).all()

    for item in parser.items:
        app.logger.info(f"Processing {item}")
        app.logger.debug(repr(item))

        article = next(filter(lambda a: a.guid == item.guid, articles), None)

        if article:
            app.logger.info(f"{item} already exists as {article}")
            app.logger.debug(repr(article))

            if article.hash == item.hash:
                app.logger.info(f"{article} is up-to-date")
                result["skipped"] += 1
            else:
                app.logger.info(f"{item} has changed, updating {article}.")

                article.update(item)

                app.logger.info(f"{article} updated")
                app.logger.debug(repr(article))

                result["updated"] += 1
        else:
            app.logger.info("No matching article found, creating new one.")

            article = Article.from_parser(
                item, subscription_id=subscription.id)

            db.session.add(article)
            db.session.flush()

            app.logger.info(f"{article} created")
            app.logger.debug(repr(article))

            result["created"] += 1

    subscription.hash = parser.hash
    subscription.time_updated = datetime.now()
    subscription.last_article_count = len(parser.items)

    db.session.commit()

    app.logger.info(f"{subscription} updated")
    app.logger.debug(json.dumps(result))

    return result
