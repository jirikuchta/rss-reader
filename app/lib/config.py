from typing import Dict, Union, Optional
from os import environ, getcwd
from flask import Flask


DEFAULT_CONFIG: Dict[str, Union[str, bool, int]] = {
    "DEBUG": True,
    "SECRET_KEY": "insecure_secret_key",
    "UPDATER_RUN_INTERVAL_SECONDS": 60,
    "SUBSCRIPTION_UPDATE_INTERVAL_SECONDS": 60,
    "PURGE_ARTICLE_AGE_DAYS": 60,
    "PURGE_UNREAD_ARTICLES": False,
    "SQLALCHEMY_DATABASE_URI": f"sqlite:///{getcwd()}/rss_reader.sqlite",
    "SQLALCHEMY_ECHO": False,
    "SQLALCHEMY_TRACK_MODIFICATIONS": False}


def init(app: Flask) -> None:
    app.config.update(DEFAULT_CONFIG)

    for k, default_value in DEFAULT_CONFIG.items():
        value: Optional[str] = environ.get(f"RSS_READER_{k}", environ.get(k))
        if value is not None:
            if type(default_value) is bool:
                app.config[k] = value.lower() in ("1", "true", "on", "yes")

            if type(default_value) is int:
                app.config[k] = int(value)

            if type(default_value) is str:
                app.config[k] = value
