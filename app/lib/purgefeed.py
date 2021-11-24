import json
from datetime import datetime, timedelta
from typing import TypedDict
from flask import current_app as app

from models import db, Subscription, Article


class PurgeOptions(TypedDict):
    max_age_days: int
    purge_unread: bool
    offset: int


def purge_subscription(subscription: Subscription,
                       options: PurgeOptions) -> int:
    app.logger.info(f"Purging {subscription}")
    app.logger.debug(json.dumps(options))

    min_time_created = datetime.now() - timedelta(days=options["max_age_days"])

    filters = [
        Article.subscription_id == subscription.id,
        Article.time_created < min_time_created,
        Article.starred.is_(False)
    ]

    if options["purge_unread"] is False:
        filters.append(Article.read.is_(True))

    query = Article.query.with_entities(Article.id).filter(*filters)

    # keep some newest items to prevent old articles
    # from rarely updated feeds to show up again
    query = query.order_by(Article.time_published.desc()) \
        .offset(options["offset"]).limit(10000)

    count = Article.query.filter(Article.id.in_(
        query.subquery().select())).delete(synchronize_session=False)

    db.session.commit()

    app.logger.info(f"{count} items purged from {subscription}")

    return count
