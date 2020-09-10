import time
from datetime import datetime, timedelta

from rss_reader.models import Feed, db


def updater(app):
    app.app_context().push()

    while True:
        feeds = Feed.query.filter(
            Feed.update_planned.is_(False),
            ((Feed.time_last_updated < datetime.now() - timedelta(minutes=1))
             | (Feed.time_last_updated.is_(None)))
        ).all()
        app.logger.info("updater")
        app.logger.info(len(feeds))

        for feed in feeds:
            feed.time_last_updated = datetime.now()

        db.session.commit()

        time.sleep(2)


def cleaner(app):
    app.app_context().push()
    while True:
        app.logger.info("cleaner")
        time.sleep(2)
