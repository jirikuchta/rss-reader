import os
import signal
from multiprocessing import Process, active_children

from rss_reader.app import create_app
from rss_reader.jobs import updater


app = None


def sigterm_handler(signum: int, frame) -> None:
    for child in active_children():
        os.kill(child.pid, signal.SIGINT)


if __name__ == "__main__":
    app = create_app()
    app_process = Process(target=app.run, kwargs={"host": "0.0.0.0"})
    app_process.start()

    p = Process(target=updater, args=[app.logger])
    p.start()

    signal.signal(signal.SIGINT, sigterm_handler)
    signal.signal(signal.SIGTERM, sigterm_handler)

    app_process.join()
    p.join()
