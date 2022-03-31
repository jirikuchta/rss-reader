import re
import os
import secrets
from flask import Flask


class Config:
    DEBUG: bool = False
    SECRET_KEY: str = secrets.token_hex(16)
    UPDATER_RUN_INTERVAL_SECONDS: int = 5*60
    SUBSCRIPTION_UPDATE_INTERVAL_SECONDS: int = 30*60
    SQLALCHEMY_DATABASE_URI: str = "sqlite:////db/rss_reader.sqlite"
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

    prefix = "sqlite:///"
    path = path[len(prefix):]

    if path.startswith("/"):  # Unix/Mac abs path
        return f"{prefix}{path}"

    if re.match("[A-Za-z]:", path):  # Windows abs path
        return f"{prefix}{path}"

    return f"{prefix}{os.getcwd()}{os.path.sep}{path}"
