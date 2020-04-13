import pytest
from xml.etree import ElementTree as ET

from rss_reader import create_app, db
from rss_reader.lib.models import User, UserRoles
from rss_reader.parser.common import NS

TestUsers = {
    "admin": {"username": "aaa", "password": "aaa", "role": UserRoles.admin},
    "user": {"username": "bbb", "password": "bbb", "role": UserRoles.user}
}


@pytest.fixture(scope="session")
def app():
    app = create_app()
    init_db(app)
    return app


@pytest.fixture(scope="function", autouse=True)
def clear_db(app) -> None:
    init_db(app)


@pytest.fixture(scope="session")
def as_admin(app):
    client = app.test_client()
    client.post("/login/", data={
        "username": TestUsers["admin"]["username"],
        "password": TestUsers["admin"]["password"]
    }, follow_redirects=True)
    return client


@pytest.fixture(scope="session")
def as_user(app):
    client = app.test_client()
    client.post("/login/", data={
        "username": TestUsers["user"]["username"],
        "password": TestUsers["user"]["password"]
    }, follow_redirects=True)
    return client


@pytest.fixture(scope="session")
def as_anonymous(app):
    return app.test_client()


def pytest_sessionstart(session: pytest.Session) -> None:
    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)


def init_db(app):
    with app.app_context():
        db.drop_all()
        db.create_all()
        db.session.add(User(**TestUsers["admin"]))
        db.session.add(User(**TestUsers["user"]))
        db.session.commit()
