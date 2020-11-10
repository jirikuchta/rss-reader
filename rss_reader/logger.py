import logging
from logging.config import dictConfig
from flask import Flask, g, has_request_context
from flask_login import current_user


class ContextFilter(logging.Filter):

    def filter(self, record):
        record.uid = "-"
        record.rid = "-"
        if has_request_context():
            record.rid = g.get("req_id", "-")
            if not g.get("skip_logger_uid_resolving", False) and current_user.is_authenticated:
                record.uid = current_user.id
        return True


def init(app: Flask):
    dictConfig({
        "version": 1,
        "formatters": {"default": {
            "datefmt": "%Y/%m/%d %H:%M:%S",
            "format": "%(asctime)s [pid:%(process)d,uid:%(uid)s,rid:%(rid)s] "
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
