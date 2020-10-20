import logging
from logging.config import dictConfig
from flask import g


class ContextFilter(logging.Filter):

    def filter(self, record):
        record.rid = g.get("req_id", "-")
        return True


dictConfig({
    "version": 1,
    "formatters": {"default": {
        "format": "%(asctime)s [pid:%(process)d,rid:%(rid)s] "
                  "%(levelname)s: %(message)s "
                  "{%(filename)s.%(funcName)s():%(lineno)d}",
        "datefmt": "%Y/%m/%d %H:%M:%S",
    }},
    "filters": {
        "ctx": {"()": ContextFilter}
    },
    "handlers": {"wsgi": {
        "class": "logging.StreamHandler",
        "stream": "ext://flask.logging.wsgi_errors_stream",
        "formatter": "default",
        "filters": ["ctx"]

    }},
    "root": {
        "level": "DEBUG",
        "handlers": ["wsgi"]
    },

})
