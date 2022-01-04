import json
from datetime import datetime, timedelta
from typing import TypedDict, Iterable, Union, Optional, cast
from flask import current_app as app
from sqlalchemy import func  # type: ignore

from models import db, Article


class PurgeOptions(TypedDict):
    subscription_id: Optional[Union[int, Iterable[int]]]
    max_age_days: int
    purge_unread: bool
    offset: int


def purge_subscription(options: PurgeOptions) -> int:
    app.logger.info("Deleting old articles")
    app.logger.debug(json.dumps(options))

    subscription_id = options.get("subscription_id")
    max_age_days = options.get("max_age_days", 0)
    purge_unread = options.get("purge_unread", False)
    offset = options.get("offset", 0)

    min_time_published = datetime.now() - timedelta(days=max_age_days)

    filters = [
        Article.time_published < min_time_published,
        Article.starred.is_(False)
    ]

    if purge_unread is False:
        filters.append(Article.read.is_(True))

    if subscription_id is not None:
        if type(subscription_id) is int:
            subscription_id = [cast(int, subscription_id)]
        filters.append(Article.subscription_id.in_(subscription_id))

    articles = Article.query.with_entities(
        Article.id,
        func.row_number().over(
            partition_by=Article.subscription_id,
            order_by=Article.time_published).label("rn")
        ).filter(*filters).all()

    article_ids = [a.id for a in filter(lambda a: a.rn > offset, articles)]

    count = Article.query.filter(
        Article.id.in_(article_ids)).delete(synchronize_session=False)

    db.session.commit()

    app.logger.info(f"{count} old articles deleted")

    return count
