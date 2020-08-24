import time

from rss_reader.app.models import Feed
from rss_reader.app.parser import parse


def updater(logger):
    feeds = Feed.query.all()

    for feed in feeds:
        parser = parse(feed.uri)

    logger.info("aaaaaaaaaaaaaaaaaaaaaaaa")
    while True:
        logger.info("worker")
        time.sleep(2)
