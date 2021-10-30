from typing import TypedDict
from os import environ, urandom
from flask import Flask


class Config(TypedDict):
    DEBUG: bool = False
    SECRET_KEY: str = urandom(16)
    UPDATER_RUN_INTERVAL_SECONDS: int = 5*60
    SUBSCRIPTION_UPDATE_INTERVAL_SECONDS: int = 30*60
    PURGE_ARTICLE_AGE_DAYS: int = 7
    PURGE_UNREAD_ARTICLES: bool = False
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///rss_reader.sqlite"
    SQLALCHEMY_ECHO: bool = False
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False


def init(app: Flask) -> None:
    for key, key_type in Config.__annotations__.items():
        value = environ.get(f"RSS_READER_{key}", environ.get(key))

        if value is None:
            app.config[key] = getattr(Config, key)
            continue

        if key_type is bool:
            app.config[key] = value.lower() in ("1", "true", "on", "yes")

        if key_type is int:
            app.config[key] = int(value)

        if key_type is str:
            app.config[key] = value
