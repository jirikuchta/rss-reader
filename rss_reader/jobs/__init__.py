from datetime import datetime, timedelta
from typing import List
import time

from rss_reader.models import db, Feed, Task, TaskType, TaskStatus


def test():
    while True:
        print(">>>>>>>>>>>>>>>>>>>>>>>>>")
        time.sleep(2)


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

        except Exception as e:
            app.logger.error(e)


def plan_new_tasks() -> None:
    outdated_feeds = Feed.query.filter(
        Feed.update_planned.is_(False),
        ((Feed.time_last_updated < datetime.now() - timedelta(minutes=1))
         | (Feed.time_last_updated.is_(None)))
    ).all()

    for feed in outdated_feeds:
        feed.update_planned = True

        task = Task()
        task.type = TaskType.UPDATE
        task.data = {"feed_id": feed.id}

        db.session.add(task)

    db.session.commit()


def get_tasks() -> List[Task]:
    return Task.query.filter_by(type=TaskType.UPDATE,
                                status=TaskStatus.QUEUED).all()


def process_task(task: Task):
    try:
        task.status = TaskStatus.FINISHED
        db.session.commit()
    except Exception:
        task.status = TaskStatus.FAILED
        db.session.commit()


if __name__ == "__main__":
    test()
