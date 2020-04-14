# https://gist.github.com/eruvanos/f6f62edb368a20aaa880e12976620db8

import requests
from flask import Flask
from threading import Thread
from xml.etree import ElementTree as ET


class FeedServer(Thread):
    def __init__(self, feed, port=3333):
        super().__init__()
        self._port = port
        self._app = Flask(__name__)
        self._url = f"http://localhost:{port}"

        self.feed = feed

        self._app.add_url_rule("/", view_func=self._make_response)
        self._app.add_url_rule("/shutdown", view_func=self._shutdown)

    @property
    def url(self):
        return self._url

    def _make_response(self):
        return ET.tostring(self.feed.build())

    def _shutdown(self):
        from flask import request
        if "werkzeug.server.shutdown" not in request.environ:
            raise RuntimeError("Not running the development server")
        request.environ["werkzeug.server.shutdown"]()
        return "Server shutting down..."

    def stop(self):
        requests.get(f"http://localhost:{self._port}/shutdown")
        self.join()

    def run(self):
        self._app.run(port=self._port)
