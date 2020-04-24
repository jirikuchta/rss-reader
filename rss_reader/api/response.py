from typing import Optional, Any
from flask import make_response, jsonify, Response


def response(code: int, data: Optional[Any] = None) -> Response:
    return make_response("" if data is None else jsonify(data), code)


def ok(data: Any) -> Response:
    return response(200, data)


def created(data: Any) -> Response:
    return response(201, data)


def no_content() -> Response:
    return response(204)


def bad_request() -> Response:
    return response(400)


def unauthorized() -> Response:
    return response(401)


def forbidden() -> Response:
    return response(403)


def not_found() -> Response:
    return response(404, {"errors": [{
        "code": "not_found"}]})


def missing_field(field: str) -> Response:
    return response(400, {"errors": [{
        "code": "missing_field",
        "field": field}]})


def invalid_field(field: str) -> Response:
    return response(400, {"errors": [{
        "code": "invalid_field",
        "field": field}]})


def already_exists() -> Response:
    return response(409, {"errors": [{
        "code": "already_exists"}]})


def parser_error() -> Response:
    return response(400, {"errors": [{
        "code": "parser_error"}]})
