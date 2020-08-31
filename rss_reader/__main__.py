import os
import signal
from multiprocessing import Process, active_children

from rss_reader import create_app
from rss_reader.jobs import updater


def sigterm_handler(signum: int, frame) -> None:
    for child in active_children():
        os.kill(child.pid, signal.SIGINT)


if __name__ == "__main__":
    app = create_app()

    app_process = Process(target=app.run, kwargs={"host": "0.0.0.0"})
    app_process.start()

    jobs_process = Process(target=updater, args=[app])
    jobs_process.start()

    signal.signal(signal.SIGINT, sigterm_handler)
    signal.signal(signal.SIGTERM, sigterm_handler)

    jobs_process.join()
    app_process.join()
