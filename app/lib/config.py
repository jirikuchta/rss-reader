from os import environ
from flask import Flask

DEFAULT_CONFIG = {
    "DEBUG": True,
    "SECRET_KEY": "insecure_secret_key",
    "UPDATER_RUN_INTERVAL": 50,
    "SUBSCRIPTION_UPDATE_INTERVAL": 60,
    "PURGE_ARTICLE_AGE": 60,
    "PURGE_UNREAD_ARTICLES": False,
    "SQLALCHEMY_DATABASE_URI": "sqlite:///rss_reader.sqlite",
    "SQLALCHEMY_ECHO": False,
    "SQLALCHEMY_TRACK_MODIFICATIONS": False}


def init(app: Flask):
    for k, v in DEFAULT_CONFIG.items():
        app.config[k] = environ.get(f"RSS_READER_{k}", environ.get(k, v))
