from flask import make_response, jsonify, abort


def response(code, data=None):
    return make_response(jsonify(data) if data else "", code)


def ok(data):
    return response(200, data)


def created(data):
    return response(201, data)


def no_content():
    return response(204)


def bad_request():
    return response(400)


def unauthorized():
    return response(401)


def forbidden():
    return response(403)


def not_found():
    return response(404)


def missing_field(field: str):
    return response(422, {"error": {
        "code": "missing_field",
        "field": field}})


def invalid_field(field: str):
    return response(422, {"error": {
        "code": "invalid_field",
        "field": field}})


def already_exists():
    return response(422, {"error": {
        "code": "already_exists"}})


def parser_error():
    return response(424, {"error": {
        "code": "parser_error"}})
