import json
from flask import current_app as app
from sqlalchemy import func  # type: ignore

from models import db, Article, Subscription


def purge_subscription(subscription_id: int = None) -> int:
    app.logger.info("Deleting old articles")
    app.logger.debug(json.dumps(subscription_id))

    offsets = {
        s.id: s.last_article_count for s in Subscription.query.with_entities(
            Subscription.id,
            Subscription.last_article_count
        ).all()
    }

    filters = [
        Article.starred.is_(False),
        Article.read.is_(True)
    ]

    if subscription_id is not None:
        filters.append(Article.subscription_id.is_(subscription_id))

    articles = Article.query.with_entities(
        Article.id,
        Article.subscription_id,
        func.row_number().over(
            partition_by=Article.subscription_id,
            order_by=Article.time_published).label("rn")
        ).filter(*filters).all()

    article_ids = [a.id for a in filter(
        lambda a: a.rn > offsets.get(a.subscription_id), articles)]

    count = Article.query.filter(
        Article.id.in_(article_ids)).delete(synchronize_session=False)

    db.session.commit()

    app.logger.info(f"{count} old articles deleted")

    return count
