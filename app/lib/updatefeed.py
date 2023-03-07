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
    deleted: int


def update_subscription(
        subscription: Subscription, purge: bool = True) -> Result:
    app.logger.info(f"Updating {subscription}")

    result: Result = {
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "deleted": 0
    }

    parser = parse(subscription.feed_url)

    if subscription.hash == parser.hash:
        app.logger.info(f"{subscription} is up-to-date.")
        result["skipped"] = len(parser.items)
        return result

    for item in parser.items:
        app.logger.info(f"Processing {item}")
        app.logger.debug(repr(item))

        article = Article.query.filter(
            Article.subscription_id == subscription.id,
            Article.guid == item.guid).first()

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

    if purge:
        app.logger.info(f"Purging {subscription}")

        articles = Article.query.order_by(
            Article.time_published.desc()
        ).filter(
            Article.subscription_id.is_(subscription.id),
            Article.starred.is_(False),
            Article.read.is_(True)
        ).limit(1000000).offset(len(parser.items)*3).all()

        result["deleted"] = Article.query.filter(
            Article.id.in_([a.id for a in articles])
        ).delete(synchronize_session=False)

    subscription.hash = parser.hash
    subscription.time_updated = datetime.now()

    db.session.commit()

    app.logger.info(f"{subscription} updated")
    app.logger.debug(json.dumps(result))

    return result
