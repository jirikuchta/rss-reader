import time

from rss_reader.models import Feed


def updater(app):
    app.app_context().push()

    app.logger.info("aaaaaaaaaaaaaaaaaaaaaaaa")
    while True:
        app.logger.info("worker")
        time.sleep(2)
