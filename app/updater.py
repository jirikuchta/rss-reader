import logging
import time

from flask import Flask

import app.logger  # noqa: F401
from app import init_app_config
from app.models import init as init_db


flask_app = Flask(__name__)
init_app_config(flask_app)
init_db(flask_app)


def init():
    with flask_app.app_context():
        while True:
            subscription = get_outdated_subscription()
            if subscription:
                try:
                    update_subscription()
                except Exception:
                    pass
            else:
                logging.info("waiting")
                time.sleep(2)


def get_outdated_subscription():
    logging.info("get_outdated_subscription")


def update_subscription() -> None:
    logging.info("update_subscription")


if __name__ == "__main__":
    init()
