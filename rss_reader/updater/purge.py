#!/usr/bin/env python3

import json
from datetime import datetime, timedelta
from typing import Optional, TypedDict

from flask import current_app as app

from rss_reader.models import db, Article


class PurgeOptions(TypedDict):
    max_age_days: int
    purge_unread: bool
    subscription_id: Optional[int]


def purge_old_articles(options: PurgeOptions) -> int:
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

    count = Article.query.filter(*filters).delete()

    db.session.commit()

    app.logger.info("Old articles purging finished: "
                    "articles_deleted_count: %d", count)

    return count
