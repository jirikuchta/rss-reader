from logging.config import dictConfig


dictConfig({
    "version": 1,
    "formatters": {"default": {
        "format": "%(asctime)s %(levelname)s: %(message)s",
        "datefmt": "%Y/%m/%d %H:%M:%S",
    }},
    "handlers": {"wsgi": {
        "class": "logging.StreamHandler",
        "stream": "ext://flask.logging.wsgi_errors_stream",
        "formatter": "default"

    }},
    "root": {
        "level": "INFO",
        "handlers": ["wsgi"]
    },

})
