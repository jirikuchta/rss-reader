import pytest
import random
import string
from xml.etree import ElementTree as ET

from app import create_app, db
from app.models import User
from app.parser.common import NS

from tests.mocks.feed_server import FeedServer
from tests.mocks.rss_feed import MockRSSFeed, MockRSSFeedItem, \
    MockRSSFeedItemGUID


TestUsers = {
    "user1": {
        "username": "user1",
        "password": "user1"},
    "user2": {
        "username": "user2",
        "password": "user2"}}


@pytest.fixture(scope="session")
def app():
    app = create_app()
    create_db(app)
    return app


@pytest.fixture(scope="function", autouse=True)
def reset(app, feed_server, randomize_feed):
    create_db(app)
    feed_server.feed = randomize_feed()


@pytest.fixture(scope="session")
def get_client(app):
    def wrapper(username, password):
        client = app.test_client()
        client.post("/login/", data={
            "username": username,
            "password": password
        }, follow_redirects=True)
        return client
    return wrapper


@pytest.fixture(scope="session")
def as_user_1(get_client):
    return get_client(**TestUsers["user1"])


@pytest.fixture(scope="session")
def as_user_2(get_client):
    return get_client(**TestUsers["user2"])


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
    return generate_feed


@pytest.fixture(scope="session")
def create_user(app):
    def wrapper(username, password):
        with app.app_context():
            user = User(username=username, password=password)
            db.session.add(user)
            db.session.commit()
            return user.id
    return wrapper


@pytest.fixture(scope="session")
def create_subscription(feed_server):
    def wrapper(client, category_id=None):
        res = client.post("/api/subscriptions/", json={
            "feed_url": feed_server.url,
            "category_id": category_id})
        assert res.status_code == 201, res
        return res.json
    return wrapper


@pytest.fixture(scope="session")
def create_category():
    def wrapper(client, title=None):
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
        db.session.add(User(**TestUsers["user1"]))
        db.session.add(User(**TestUsers["user2"]))
        db.session.commit()


def generate_str(length=8):
    return "".join(random.choices(
        string.ascii_lowercase + string.digits, k=length))


def generate_feed():
    return MockRSSFeed(
        title=generate_str(),
        link=f"http://{generate_str()}",
        items=[MockRSSFeedItem(
            title=generate_str(),
            link=f"http://{generate_str()}",
            guid=MockRSSFeedItemGUID(value=generate_str()),
            description=generate_str(100))
            for i in range(random.randrange(1, 10))])
