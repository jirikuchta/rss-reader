import pytest

from updater import update_subscriptions

from tests.mocks.rss_feed import MockRSSFeedItem, MockRSSFeedItemGUID


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


class TestUpdateSubscriptions:

    @pytest.mark.parametrize("options,expected_count", [
        ({"interval": 60, "subscription_id": None}, 0),
        ({"interval": 0, "subscription_id": None}, 1),
        ({"interval": 0, "subscription_id": 666}, 0)])
    def test_options(self, options, expected_count, app, create_subscription):
        with app.app_context():
            res = update_subscriptions(options)
            assert res["total_count"] == expected_count
            assert len(res["succeeded_ids"]) == expected_count
            assert len(res["failed_ids"]) == 0

    def test_all_articles_skipped(
            self, client, app, create_subscription, updater_feed_server):
        sid = client.get("/api/subscriptions/").json[0]["id"]
        with app.app_context():
            res = update_subscriptions({
                "interval": 0,
                "subscription_id": sid})["results"][sid]

        assert res["new_items"] == 0
        assert res["updated_items"] == 0
        assert res["skipped_items"] == FEED_ARTICLE_COUNT

    def test_new_feed_item(
            self, client, app, create_subscription, updater_feed_server):
        sid = client.get("/api/subscriptions/").json[0]["id"]
        new_item = MockRSSFeedItem(
            title="foo", link="foo", guid=MockRSSFeedItemGUID(""))

        updater_feed_server.feed.items.append(new_item)

        with app.app_context():
            res = update_subscriptions({
                "interval": 0,
                "subscription_id": sid})["results"][sid]

        assert res["new_items"] == 1
        assert res["updated_items"] == 0
        assert res["skipped_items"] == FEED_ARTICLE_COUNT

    def test_updated_feed_item(
            self, client, app, create_subscription, updater_feed_server):
        sid = client.get("/api/subscriptions/").json[0]["id"]

        updater_feed_server.feed.items[0].title = "foo"

        with app.app_context():
            res = update_subscriptions({
                "interval": 0,
                "subscription_id": sid})["results"][sid]

        assert res["new_items"] == 0
        assert res["updated_items"] == 1
        assert res["skipped_items"] == FEED_ARTICLE_COUNT - 1
