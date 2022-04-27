from threading import Thread
from xml.etree import ElementTree as ET

from werkzeug import Request, Response
from werkzeug.serving import make_server


class FeedServer():
    def __init__(self, feed):
        self.feed = feed

    @property
    def url(self):
        return "http://localhost:3333"

    @Request.application
    def _make_response(self, request):
        return Response(ET.tostring(self.feed.build()), 200)

    def start(self):
        self._server = make_server("localhost", 3333, self._make_response)

        self._thread = Thread(target=self._server.serve_forever)
        self._thread.start()

    def stop(self):
        self._server.shutdown()
        self._thread.join()
