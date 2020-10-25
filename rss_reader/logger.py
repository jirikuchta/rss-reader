import logging
from logging.config import dictConfig
from flask import Flask, g, has_request_context


class ContextFilter(logging.Filter):

    def filter(self, record):
        record.rid = g.get("req_id", "-") if has_request_context() else "-"
        return True


def init(app: Flask):
    dictConfig({
        "version": 1,
        "formatters": {"default": {
            "datefmt": "%Y/%m/%d %H:%M:%S",
            "format": "%(asctime)s [pid:%(process)d,rid:%(rid)s] "
                      "%(levelname)s: %(message)s "
                      "{%(filename)s.%(funcName)s():%(lineno)d}",
        }},
        "filters": {
            "ctx": {"()": ContextFilter}
        },
        "handlers": {"default": {
            "class": "logging.StreamHandler",
            "stream": "ext://flask.logging.wsgi_errors_stream",
            "formatter": "default",
            "filters": ["ctx"]

        }},
        "root": {
            "level": "DEBUG" if app.config["DEBUG"] is True else "INFO",
            "handlers": ["default"]
        }
    })
