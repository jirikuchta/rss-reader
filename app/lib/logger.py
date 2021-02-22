import string
import random
from datetime import datetime
import logging
from logging.config import dictConfig
from flask import Flask, g, has_app_context, request, Response, current_app


def generate_ctx_id():
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=8))


def before_request():
    g.ctx = generate_ctx_id()
    g.req_start_time = datetime.utcnow().timestamp()

    current_app.logger.info(
        ">| %s %s%s, data: %s",
        request.method, request.full_path,
        request.query_string.decode(), request.data.decode() or None)


def after_request(res: Response):
    now = datetime.utcnow().timestamp()
    req_duration_sec = now - g.req_start_time

    current_app.logger.info(">| %s (%fs)", res.status, req_duration_sec)

    try:
        current_app.logger.debug(str(res.data.decode()))
    except UnicodeError:
        pass

    g.ctx = None
    g.req_start_time = None

    return res


class ContextFilter(logging.Filter):

    def filter(self, record):
        record.ctx = g.get("ctx", "-") if has_app_context() else "-"
        return True


def init(app: Flask):
    dictConfig({
        "version": 1,
        "formatters": {"default": {
            "datefmt": "%Y/%m/%d %H:%M:%S",
            "format": "%(asctime)s [%(ctx)s] %(levelname)s: %(message)s "
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
