import re
import os
from typing import TypedDict
from flask import Flask


class Config(TypedDict):
    DEBUG: bool = False
    SECRET_KEY: str = os.urandom(16)
    UPDATER_RUN_INTERVAL_SECONDS: int = 5*60
    SUBSCRIPTION_UPDATE_INTERVAL_SECONDS: int = 30*60
    PURGE_ARTICLE_AGE_DAYS: int = 7
    PURGE_UNREAD_ARTICLES: bool = False
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///rss_reader.sqlite"
    SQLALCHEMY_ECHO: bool = False
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False


def init(app: Flask) -> None:
    for key, key_type in Config.__annotations__.items():
        value = os.environ.get(f"RSS_READER_{key}", os.environ.get(key))

        if key == "SQLALCHEMY_DATABASE_URI":
            if value is None:
                value = getattr(Config, key)

            if value.startswith("sqlite"):
                app.config[key] = ensure_sqlite_abs_path(value)
                continue

        if value is None:
            app.config[key] = getattr(Config, key)
            continue

        if key_type is bool:
            app.config[key] = value.lower() in ("1", "true", "on", "yes")

        if key_type is int:
            app.config[key] = int(value)

        if key_type is str:
            app.config[key] = value


def ensure_sqlite_abs_path(path: str):
    # https://docs.sqlalchemy.org/en/14/core/engines.html#sqlite

    if path.startswith("sqlite:////"):  # Unix/Mac abs path
        return path

    if re.match("sqlite:///[A-Z]:", path):  # Windows abs path
        return path

    return f"sqlite:///{os.getcwd()}{os.path.sep}{path[10:]}"
