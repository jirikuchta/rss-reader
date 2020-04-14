import pytest
import random
import string
from xml.etree import ElementTree as ET

from rss_reader import create_app, db
from rss_reader.lib.models import User, UserRoles
from rss_reader.parser.common import NS

from tests.mocks.feed_server import FeedServer
from tests.mocks.rss_feed import MockRSSFeed, MockRSSFeedItem, \
    MockRSSFeedItemGUID


TestUsers = {
    "admin": {"username": "aaa", "password": "aaa", "role": UserRoles.admin},
    "user": {"username": "bbb", "password": "bbb", "role": UserRoles.user}
}


@pytest.fixture(scope="session")
def app():
    app = create_app()
    create_db(app)
    return app


@pytest.fixture(scope="function", autouse=True)
def reset(app) -> None:
    create_db(app)


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


@pytest.fixture(scope="session")
def feed_server(randomize_feed):
    server = FeedServer(randomize_feed())
    server.start()
    yield server
    server.stop()


@pytest.fixture(scope="session")
def randomize_feed():
    def randomize():
        def random_str(length=8):
            return "".join(random.choices(
                string.ascii_lowercase + string.digits, k=length))

        return MockRSSFeed(
            title=random_str(),
            link=f"http://{random_str()}",
            items=[MockRSSFeedItem(
                title=random_str(),
                link=f"http://{random_str()}",
                guid=MockRSSFeedItemGUID(value=random_str()),
                description=random_str(100))
                for i in range(random.randrange(10))])

    return randomize


def pytest_sessionstart(session: pytest.Session) -> None:
    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)


def create_db(app):
    with app.app_context():
        db.drop_all()
        db.create_all()
        db.session.add(User(**TestUsers["admin"]))
        db.session.add(User(**TestUsers["user"]))
        db.session.commit()
