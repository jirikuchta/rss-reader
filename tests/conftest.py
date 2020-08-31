import pytest
import random
import string
from xml.etree import ElementTree as ET

from rss_reader import create_app, db
from rss_reader.models import User, UserRole, Feed, Subscription
from rss_reader.parser.common import NS
from rss_reader.parser.rss import RSSParser

from tests.mocks.feed_server import FeedServer
from tests.mocks.rss_feed import MockRSSFeed, MockRSSFeedItem, \
    MockRSSFeedItemGUID


TestUsers = {
    "admin": {
        "username": "admin",
        "password": "admin",
        "role": UserRole.admin},
    "user": {
        "username": "user",
        "password": "user",
        "role": UserRole.user}}


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
    return generate_feed


@pytest.fixture(scope="session")
def create_user(as_admin):
    def wrapper(username=None, password=None, role=None):
        res = as_admin.post("/api/users/", json={
            "username": username if username else generate_str(),
            "password": password if password else generate_str(),
            "role": role})
        assert res.status_code == 201, res
        return res.json
    return wrapper


@pytest.fixture(scope="session")
def create_subscription(feed_server):
    def wrapper(client, category_id=None):
        res = client.post("/api/subscriptions/", json={
            "uri": feed_server.url,
            "categoryId": category_id})
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


@pytest.fixture(scope="session")
def admin_id(as_admin):
    res = as_admin.get("api/users/current/")
    assert res.status_code == 200, res
    return res.json["id"]


@pytest.fixture(scope="session")
def user_id(as_user):
    res = as_user.get("api/users/current/")
    assert res.status_code == 200, res
    return res.json["id"]


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
        db.session.add(User(**TestUsers["admin"]))
        db.session.add(User(**TestUsers["user"]))

        # fill some random data
        hidden_user_1 = User(username=generate_str(), password=generate_str())
        hidden_user_2 = User(username=generate_str(), password=generate_str())
        shared_feed = Feed.from_parser(RSSParser(generate_feed().build()))
        db.session.add(Subscription(user=hidden_user_1, feed=shared_feed))
        db.session.add(Subscription(user=hidden_user_2, feed=shared_feed))
        db.session.add(Subscription(
            user=hidden_user_1,
            feed=Feed.from_parser(RSSParser(generate_feed().build()))))
        db.session.add(Subscription(
            user=hidden_user_2,
            feed=Feed.from_parser(RSSParser(generate_feed().build()))))

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
            for i in range(random.randrange(10))])
