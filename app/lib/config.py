from typing import TypedDict
from os import environ
from flask import Flask


class Config(TypedDict):
    DEBUG: bool
    SECRET_KEY: str
    UPDATER_RUN_INTERVAL_SECONDS: int
    SUBSCRIPTION_UPDATE_INTERVAL_SECONDS: int
    PURGE_ARTICLE_AGE_DAYS: int
    PURGE_UNREAD_ARTICLES: bool
    SQLALCHEMY_DATABASE_URI: str
    SQLALCHEMY_ECHO: bool
    SQLALCHEMY_TRACK_MODIFICATIONS: bool


def init(app: Flask) -> None:
    for key, key_type in Config.__annotations__.items():
        value = environ.get(f"RSS_READER_{key}", environ.get(key))

        if value is None:
            continue

        if key_type is bool:
            app.config[key] = value.lower() in ("1", "true", "on", "yes")

        if key_type is int:
            app.config[key] = int(value)

        if key_type is str:
            app.config[key] = value
