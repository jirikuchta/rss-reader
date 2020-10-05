import logging
import time

logging.basicConfig(level=logging.DEBUG)


def init():
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
