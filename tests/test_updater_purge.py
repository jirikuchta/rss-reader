import pytest

from updater import purge_subscriptions


FEED_ARTICLE_COUNT = 5


@pytest.fixture(scope="function")
def updater_feed_server(feed_server, randomize_feed):
    feed_server.feed = randomize_feed(items_count=FEED_ARTICLE_COUNT)
    yield feed_server
    feed_server.feed = randomize_feed()


@pytest.fixture(scope="function")
def create_subscription(client, updater_feed_server):
    res = client.post("/api/subscriptions/",
                      json={"feed_url": updater_feed_server.url})
    assert res.status_code == 201, res


@pytest.mark.parametrize("purge_unread,expected_count", [
    (False, 0),
    (True, FEED_ARTICLE_COUNT)])
def test_purge_unread(purge_unread, expected_count, app, create_subscription):
    with app.app_context():
        assert purge_subscriptions()["count"] == expected_count


def test_purge_subscription_id(app, client, create_subscription):
    subscription_id = client.get("/api/subscriptions/").json[0]["id"]

    with app.app_context():
        assert purge_subscriptions(666)["count"] == 0
        assert purge_subscriptions(subscription_id)["count"] == FEED_ARTICLE_COUNT


def test_do_not_purge_starred(app, client, create_subscription):
    article_id = client.get("/api/articles/").json[0]["id"]

    res = client.patch(f"/api/articles/{article_id}/", json={"starred": True})
    assert res.status_code == 200, res

    with app.app_context():
        assert purge_subscriptions()["count"] == FEED_ARTICLE_COUNT - 1
