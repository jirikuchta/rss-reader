from datetime import datetime

from flask import current_app as app

from rss_reader.parser import parse
from rss_reader.models import db, Subscription, Article


def update_subscription(subscription: Subscription):
    parser = parse(subscription.feed_url)

    articles = Article.query.filter(
        Article.subscription_id == subscription.id).all()

    for item in parser.items:
        article = next(filter(lambda a: a.guid == item.guid, articles), None)

        if article is None:
            app.logger.info("Creating new article %s", item.guid)
            db.session.add(Article.from_parser(
                item,
                subscription_id=subscription.id, user_id=subscription.user_id))
        else:
            if article.hash == item.hash:
                app.logger.info("Article %s already exists", item.guid)

    subscription.time_updated = datetime.now()

    db.session.commit()
