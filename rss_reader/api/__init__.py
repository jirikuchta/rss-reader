from flask import Blueprint
from flask_login import current_user
from functools import wraps

import rss_reader.api.response as res
from rss_reader.lib.models import UserRoles


api = Blueprint("api", __name__, url_prefix="/api")


def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return res.unauthorized()
        return func(*args, **kwargs)
    return wrapper


def admin_role_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return res.unauthorized()
        if current_user.role != UserRoles.admin:
            return res.forbidden()
        return func(*args, **kwargs)
    return wrapper
