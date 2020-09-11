from typing import List
import time
from datetime import datetime, timedelta

from rss_reader.models import db, Feed, Job, JobType, JobStatus


def run(app):
    app.app_context().push()
    while True:
        try:
            plan_new_tasks()
            tasks = get_tasks()

            for task in tasks:
                process_task(task)

            if len(tasks) == 0:
                time.sleep(2)

        except Exception:
            pass


def plan_new_tasks() -> None:
    outdated_feeds = Feed.query.filter(
        Feed.update_planned.is_(False),
        ((Feed.time_last_updated < datetime.now() - timedelta(minutes=1))
         | (Feed.time_last_updated.is_(None)))
    ).all()

    for feed in outdated_feeds:
        feed.update_planned = True

        job = Job()
        job.type = JobType.update
        job.data = {"feed_id": feed.id}
        db.session.add(job)

    db.session.commit()


def get_tasks() -> List[Job]:
    return Job.query.filter_by(type=JobType.update,
                               status=JobStatus.waiting).all()


def process_task(task: Job):
    pass
