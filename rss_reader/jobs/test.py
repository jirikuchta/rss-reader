import time
import logging
import sys

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

root = logging.getLogger()
root.setLevel(logging.DEBUG)
root.addHandler(handler)


def test():
    while True:
        logging.info('This is an info message')
        time.sleep(2)


if __name__ == "__main__":
    test()
