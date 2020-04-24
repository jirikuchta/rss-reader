from flask import Blueprint, Response
from flask_login import current_user
from functools import wraps
from typing import TypeVar, Callable, Union

import rss_reader.api.response as res
from rss_reader.lib.models import UserRole


RT = TypeVar("RT")


api = Blueprint("api", __name__, url_prefix="/api")


def login_required(func: Callable[..., RT]) -> Callable[..., RT]:
    @wraps(func)
    def wrapper(*args, **kwargs) -> Union[RT, Response]:
        if not current_user.is_authenticated:
            return res.unauthorized()
        return func(*args, **kwargs)
    return wrapper


def admin_role_required(func: Callable[..., RT]) -> Callable[..., RT]:
    @wraps(func)
    def wrapper(*args, **kwargs) -> Union[RT, Response]:
        if not current_user.is_authenticated:
            return res.unauthorized()
        if current_user.role != UserRole.admin:
            return res.forbidden()
        return func(*args, **kwargs)
    return wrapper
