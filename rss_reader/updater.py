#!/usr/bin/env python3

import argparse
import json
import time
from datetime import datetime, timedelta
from typing import Optional, TypedDict

from flask import Flask, current_app

from rss_reader import init_config
from rss_reader.logger import init as init_logger
from rss_reader.models import init as init_db, db, Article


class PurgeOptions(TypedDict):
    max_age_days: int
    purge_unread: bool
    subscription_id: Optional[int]


def purge_old_articles(options: PurgeOptions) -> int:
    current_app.logger.info("Old articles purging started: %s",
                            json.dumps(options))

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

    current_app.logger.info("Old articles purging finished: "
                            "articles_deleted_count: %d", count)

    return count


def update_subscriptions(subscription_id: Optional[int] = None):
    pass


def main(loop: bool = False, subscription_id: Optional[int] = None):
    app = Flask(__name__)
    init_config(app)
    init_logger(app)
    init_db(app)

    with app.app_context():
        while True:
            try:
                purge_old_articles({
                    "subscription_id": subscription_id,
                    "max_age_days": app.config["PURGE_ARTICLE_AGE"],
                    "purge_unread": app.config["PURGE_UNREAD_ARTICLES"]
                })
                update_subscriptions(subscription_id)
            except Exception as e:
                app.logger.critical("Failed to run updater, err=%s", e)
                raise e

            if not loop:
                break

            time.sleep(app.config["UPDATER_RUN_INTERVAL"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument("--subscription_id", type=int)
    parser.set_defaults(subscription_id=None)

    parser.add_argument("--loop", dest="loop", action="store_true")
    parser.set_defaults(loop=False)

    args = parser.parse_args()

    main(args.loop, args.subscription_id)
