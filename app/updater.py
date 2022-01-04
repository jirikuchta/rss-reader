import argparse
import json
import time
from datetime import datetime, timedelta
from typing import Optional, TypedDict, List, Dict

from flask import Flask, g

from lib.config import init as init_config
from lib.logger import init as init_logger
from lib.purgefeed import purge_subscription, PurgeOptions
from lib.updatefeed import update_subscription, \
    Result as SubscriptionUpdateResult
from models import init as init_db, Subscription

app = Flask(__name__)
init_config(app)
init_logger(app)
init_db(app)


class UpdateOptions(TypedDict):
    interval: int
    subscription_id: Optional[int]


class UpdateResult(TypedDict):
    total_count: int
    succeeded_ids: List[int]
    failed_ids: List[int]
    results: Dict[int, SubscriptionUpdateResult]


def update_subscriptions(options: UpdateOptions) -> UpdateResult:
    start_time = datetime.utcnow().timestamp()
    g.ctx = "update"
    app.logger.info("Started")
    app.logger.debug(json.dumps(options))

    min_time_updated = datetime.now() - timedelta(seconds=options["interval"])

    filters = [
        Subscription.time_updated < min_time_updated
    ]

    if options["subscription_id"] is not None:
        filters.append(Subscription.id == options["subscription_id"])

    subscriptions = Subscription.query.filter(*filters).all()

    app.logger.info(f"{len(subscriptions)} subscription(s) to be checked")

    result: UpdateResult = {
        "total_count": len(subscriptions),
        "succeeded_ids": [],
        "failed_ids": [],
        "results": {}
    }

    for subscription in subscriptions:
        try:
            res = update_subscription(subscription)
            result["results"][subscription.id] = res
            result["succeeded_ids"].append(subscription.id)
        except Exception as e:
            app.logger.warning(f"{subscription} update failed: err={e}")
            result["failed_ids"].append(subscription.id)

    now = datetime.utcnow().timestamp()
    duration_sec = now - start_time

    app.logger.info(f"Finished ({round(duration_sec, 4)}s)")
    app.logger.debug(json.dumps(result))

    g.ctx = None

    return result


class PurgeResult(TypedDict):
    count: int


def purge_subscriptions(options: PurgeOptions) -> PurgeResult:
    start_time = datetime.utcnow().timestamp()
    g.ctx = "purge"
    app.logger.info("Started")
    app.logger.debug(json.dumps(options))

    result: PurgeResult = {
        "count": 0
    }

    try:
        result["count"] = purge_subscription(options)
    except Exception as e:
        app.logger.warning(f"purge failed: err={e}")

    now = datetime.utcnow().timestamp()
    duration_sec = now - start_time

    app.logger.info(f"Finished ({round(duration_sec, 4)}s)")
    app.logger.debug(json.dumps(result))

    g.ctx = None

    return result


def main(loop: bool = False, subscription_id: Optional[int] = None):
    with app.app_context():
        while True:
            try:
                update_subscriptions({
                    "interval": app.config["SUBSCRIPTION_UPDATE_INTERVAL_SECONDS"],
                    "subscription_id": subscription_id,
                })
                purge_subscriptions({
                    "subscription_id": subscription_id,
                    "max_age_days": app.config["PURGE_AGE_DAYS"],
                    "purge_unread": app.config["PURGE_UNREAD"],
                    "offset": app.config["PURGE_OFFSET"]
                })
            except Exception as e:
                app.logger.critical(f"Failed to run updater, err={e}")

            if not loop:
                break

            time.sleep(app.config["UPDATER_RUN_INTERVAL_SECONDS"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument("--subscription_id", type=int)
    parser.set_defaults(subscription_id=None)

    parser.add_argument("--loop", dest="loop", action="store_true")
    parser.set_defaults(loop=False)

    args = parser.parse_args()

    main(args.loop, args.subscription_id)
