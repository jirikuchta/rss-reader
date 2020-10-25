import time

from flask import Flask

from rss_reader import init_config
from rss_reader.logger import init as init_logger
from rss_reader.models import init as init_db


app = Flask(__name__)
init_config(app)
init_logger(app)
init_db(app)


def init():
    with app.app_context():
        while True:
            subscription = get_outdated_subscription()
            if subscription:
                try:
                    update_subscription()
                except Exception:
                    pass
            else:
                app.logger.info("waiting")
                app.logger.debug("debug")
                time.sleep(2)


def get_outdated_subscription():
    app.logger.info("get_outdated_subscription")


def update_subscription() -> None:
    app.logger.info("update_subscription")


if __name__ == "__main__":
    init()
