import string
import random
from datetime import datetime
import logging
from logging.config import dictConfig
from flask import Flask, g, has_request_context, request, Response, current_app
from flask_login import current_user


def generate_request_id():
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=8))


def before_request():
    g.req_id = generate_request_id()
    g.req_start_time = datetime.utcnow().timestamp()

    current_app.logger.info(
        "Request: %s %s%s, data: %s, uid: %s",
        request.method, request.full_path,
        request.query_string.decode(), request.data.decode() or None,
        current_user.id if current_user.is_authenticated else "-")


def after_request(response: Response):
    now = datetime.utcnow().timestamp()
    req_duration_sec = now - g.req_start_time
    current_app.logger.info("Response: status: %d, time: %fs",
                            response.status_code, req_duration_sec)
    current_app.logger.debug("Response data: %s", response.data.decode())

    g.req_id = None
    g.req_start_time = None

    return response


class ContextFilter(logging.Filter):

    def filter(self, record):
        record.rid = g.get("req_id", "-") if has_request_context() else "-"
        return True


def init(app: Flask):
    dictConfig({
        "version": 1,
        "formatters": {"default": {
            "datefmt": "%Y/%m/%d %H:%M:%S",
            "format": "%(asctime)s [%(rid)s] %(levelname)s: %(message)s "
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
