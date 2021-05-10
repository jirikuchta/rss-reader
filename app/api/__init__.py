from enum import Enum, auto
from collections import namedtuple
from flask import Flask, Blueprint, jsonify, make_response, Response
from functools import wraps
from typing import TypeVar, Callable, cast, Tuple, Any, Dict

from lib.logger import before_request, after_request


TReturnValue = Tuple[Any, int]
TApiMethod = TypeVar('TApiMethod', bound=Callable[..., TReturnValue])

api_bp = Blueprint("api", __name__, url_prefix="/api")


def init(app: Flask) -> None:
    import api.articles  # noqa: F401
    import api.categories  # noqa: F401
    import api.subscriptions  # noqa: F401
    import api.counters  # noqa: F401

    api_bp.before_request(before_request)
    api_bp.after_request(after_request)

    app.register_blueprint(api_bp)


class ErrorType(Enum):
    BadRequest = auto()
    MissingField = auto()
    InvalidField = auto()
    ParserError = auto()
    AmbiguousFeedUrl = auto()
    NotFound = auto()
    AlreadyExists = auto()


Error = namedtuple("ErrorCode", "status_code, error_code")
Errors: Dict[ErrorType, Error] = {
    ErrorType.BadRequest: Error(400, "bad_request"),
    ErrorType.MissingField: Error(400, "missing_field"),
    ErrorType.InvalidField: Error(400, "invalid_field"),
    ErrorType.ParserError: Error(400, "parser_error"),
    ErrorType.AmbiguousFeedUrl: Error(400, "ambiguous_feed_url"),
    ErrorType.NotFound: Error(404, "not_found"),
    ErrorType.AlreadyExists: Error(409, "already_exists")}


class ClientError(Exception):

    def __init__(self, error: ErrorType, **kwargs) -> None:
        self.status_code = Errors[error].status_code
        self.data = {"error": kwargs}
        self.data["error"].update({"code": Errors[error].error_code})


class MissingFieldError(ClientError):

    def __init__(self, field: str, **kwargs) -> None:
        super().__init__(ErrorType.MissingField, **kwargs)
        self.data["error"]["field"] = field


class InvalidFieldError(ClientError):

    def __init__(self, field: str, **kwargs) -> None:
        super().__init__(ErrorType.InvalidField, **kwargs)
        self.data["error"]["field"] = field


def make_api_response(func: TApiMethod) -> TApiMethod:
    @wraps(func)
    def wrapper(*args, **kwargs) -> Response:
        try:
            data, status_code = func(*args, **kwargs)
        except ClientError as e:
            data = e.data
            status_code = e.status_code

        if data is None:
            data = ""

        if data is not None:
            data = jsonify(data)

        return make_response(data, status_code)
    return cast(TApiMethod, wrapper)
