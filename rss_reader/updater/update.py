import json
from datetime import datetime, timedelta
from typing import Optional, TypedDict, List

from flask import current_app as app

from rss_reader.models import Subscription


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

    app.logger.info("Going to update %d subscription(s)", len(subscriptions))

    result: UpdateResult = {
        "total_count": len(subscriptions),
        "succeeded": [],
        "failed": []
    }

    for subscription in subscriptions:
        update_subscription(subscription)

    app.logger.info("Subscriptions update finished: %s", json.dumps(result))

    return result


def update_subscription(subscription: Subscription):
    pass
