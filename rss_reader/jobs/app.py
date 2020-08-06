import time
from flask import current_app
from multiprocessing import Process


def f():
    while True:
        if current_app:
            current_app.logger.info("worker")
        time.sleep(2)


class Jobs():

    def __init__(self, app=None):

        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        app.logger.info("init_app")
        app.teardown_appcontext(self.teardown)

        self.p = Process(target=f)
        self.p.start()

    def teardown(self, exception):
        if current_app:
            current_app.logger.info("teardown")
