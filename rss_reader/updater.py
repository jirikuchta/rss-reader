import time


def init():
    while True:
        subscription = get_outdated_subscription()
        if subscription:
            try:
                update_subscription()
            except Exception:
                pass
        else:
            print("waiting")
            time.sleep(2)


def get_outdated_subscription():
    print("get_outdated_subscription")


def update_subscription() -> None:
    print("update_subscription")


if __name__ == "__main__":
    init()
