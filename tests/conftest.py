import pytest
import random
import string
from xml.etree import ElementTree as ET

from app import app as rss_reader_app
from models import db
from lib.parser.common import NS

from tests.mocks.feed_server import FeedServer
from tests.mocks.rss_feed import MockRSSFeed, MockRSSFeedItem, \
    MockRSSFeedItemGUID


@pytest.fixture(scope="session")
def app():
    create_db(rss_reader_app)
    return rss_reader_app


@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function", autouse=True)
def reset(app, feed_server, randomize_feed):
    create_db(app)
    feed_server.feed = randomize_feed()


@pytest.fixture(scope="session")
def feed_server(randomize_feed):
    server = FeedServer(randomize_feed())
    server.start()
    yield server
    server.stop()


@pytest.fixture(scope="session")
def randomize_feed():
    return generate_feed


@pytest.fixture(scope="session")
def create_subscription(client, feed_server):
    def wrapper(category_id=None):
        res = client.post("/api/subscriptions/", json={
            "feed_url": feed_server.url,
            "category_id": category_id})
        assert res.status_code == 201, res
        return res.json
    return wrapper


@pytest.fixture(scope="session")
def create_category(client):
    def wrapper(title=None):
        if title is None:
            title = generate_str()
        res = client.post("/api/categories/", json={"title": title})
        assert res.status_code == 201, res
        return res.json
    return wrapper


@pytest.fixture(scope="function")
def rand_str():
    return generate_str()


def pytest_sessionstart(session: pytest.Session) -> None:
    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)


def create_db(app):
    with app.app_context():
        db.drop_all()
        db.create_all()
        db.session.commit()


def generate_str(length=8):
    return "".join(random.choices(
        string.ascii_lowercase + string.digits, k=length))


def generate_feed(items_count: int = None):
    min = items_count if items_count is not None else 10
    max = items_count + 1 if items_count is not None else 20

    return MockRSSFeed(
        title=generate_str(),
        link=f"http://{generate_str()}",
        items=[MockRSSFeedItem(
            title=generate_str(),
            link=f"http://{generate_str()}",
            guid=MockRSSFeedItemGUID(value=generate_str()),
            description=generate_str(100))
            for i in range(random.randrange(min, max))])
