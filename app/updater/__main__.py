import argparse
import time
from typing import Optional

from flask import Flask

from lib.config import init as init_config
from lib.logger import init as init_logger
from models import init as init_db
from updater import purge_old_articles, update_subscriptions


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
                update_subscriptions({
                    "interval": app.config["SUBSCRIPTION_UPDATE_INTERVAL"],
                    "subscription_id": subscription_id,
                })
            except Exception as e:
                app.logger.critical("Failed to run updater, err=%s", e)

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
