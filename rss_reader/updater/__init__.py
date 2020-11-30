import json
from datetime import datetime, timedelta
from typing import Optional, TypedDict, List

from flask import current_app as app

from rss_reader.models import db, Subscription, Article
from rss_reader.updater.update import update_subscription


class UpdateOptions(TypedDict):
    interval: int
    subscription_id: Optional[int]


class UpdateResult(TypedDict):
    total_count: int
    succeeded: List[int]
    failed: List[int]


def update_subscriptions(options: UpdateOptions) -> UpdateResult:
    app.logger.info("Subscriptions update started: %s", json.dumps(options))

    min_time_updated = datetime.now() - timedelta(minutes=options["interval"])

    filters = [
        Subscription.time_updated < min_time_updated
    ]

    if options["subscription_id"] is not None:
        filters.append(Subscription.id == options["subscription_id"])

    subscriptions = Subscription.query.filter(*filters).all()

    app.logger.info("%d subscription(s) needs to be updated",
                    len(subscriptions))

    result: UpdateResult = {
        "total_count": len(subscriptions),
        "succeeded": [],
        "failed": []
    }

    for subscription in subscriptions:
        try:
            update_subscription(subscription)
            result["succeeded"].append(subscription.id)
        except Exception as e:
            app.logger.warning("Failed to update subscription: %s, err=%s",
                               subscription, e)
            result["failed"].append(subscription.id)

    app.logger.info("Subscriptions update finished: %s", json.dumps(result))

    return result


class PurgeOptions(TypedDict):
    max_age_days: int
    purge_unread: bool
    subscription_id: Optional[int]


class PurgeResult(TypedDict):
    total_count: int


def purge_old_articles(options: PurgeOptions) -> PurgeResult:
    app.logger.info("Old articles purging started: %s", json.dumps(options))

    min_time_created = datetime.now() - timedelta(days=options["max_age_days"])

    filters = [
        Article.time_created < min_time_created,
        Article.time_starred.is_(None)
    ]

    if options["subscription_id"] is not None:
        filters.append(Article.subscription_id == options["subscription_id"])

    if options["purge_unread"] is False:
        filters.append(Article.time_read.isnot(None))

    result: PurgeResult = {
        "total_count": Article.query.filter(*filters).delete()
    }

    db.session.commit()

    app.logger.info("Old articles purging finished: %s", json.dumps(result))

    return result
