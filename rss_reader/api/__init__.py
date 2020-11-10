import string
import random
from datetime import datetime
from enum import Enum, auto
from collections import namedtuple
from flask import Flask, Blueprint, jsonify, make_response, g, request, \
    Response
from flask_login import current_user
from functools import wraps
from typing import TypeVar, Callable, cast, Tuple, Any, Dict


TReturnValue = Tuple[Any, int]
TApiMethod = TypeVar('TApiMethod', bound=Callable[..., TReturnValue])

api = Blueprint("api", __name__, url_prefix="/api")


def generate_request_id():
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=8))


def init(app: Flask) -> None:
    import rss_reader.api.articles  # noqa: F401
    import rss_reader.api.categories  # noqa: F401
    import rss_reader.api.subscriptions  # noqa: F401
    import rss_reader.api.users  # noqa: F401

    def before_request():
        g.req_id = generate_request_id()
        g.req_start_time = datetime.utcnow().timestamp()
        app.logger.info(
            "API request: %s %s", request.method, request.full_path)

    def after_request(response: Response):
        app.logger.info("API response: %d", response.status_code)
        app.logger.debug("%s", response.get_data().decode())

        now = datetime.utcnow().timestamp()
        req_duration_sec = now - g.req_start_time
        app.logger.info("Took %fs", req_duration_sec)

        g.req_id = None
        g.req_start_time = None

        return response

    api.before_request(before_request)
    api.after_request(after_request)

    app.register_blueprint(api)


class ErrorType(Enum):
    BadRequest = auto()
    MissingField = auto()
    InvalidField = auto()
    ParserError = auto()
    Unauthorized = auto()
    Forbidden = auto()
    NotFound = auto()
    AlreadyExists = auto()


Error = namedtuple("ErrorCode", "status_code, error_code")
Errors: Dict[ErrorType, Error] = {
    ErrorType.BadRequest: Error(400, "bad_request"),
    ErrorType.MissingField: Error(400, "missing_field"),
    ErrorType.InvalidField: Error(400, "invalid_field"),
    ErrorType.ParserError: Error(400, "parser_error"),
    ErrorType.Unauthorized: Error(401, "unauthorized"),
    ErrorType.Forbidden: Error(403, "forbidden"),
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


def require_login(func: TApiMethod) -> TApiMethod:
    @wraps(func)
    def wrapper(*args, **kwargs) -> TReturnValue:
        if not current_user.is_authenticated:
            raise ClientError(ErrorType.Unauthorized)
        return func(*args, **kwargs)
    return cast(TApiMethod, wrapper)


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
