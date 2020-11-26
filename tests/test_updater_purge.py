import pytest
from rss_reader.updater.purge import purge_old_articles


FEED_ARTICLE_COUNT = 5


@pytest.fixture(scope="function")
def updater_feed_server(feed_server, randomize_feed):
    feed_server.feed = randomize_feed(items_count=FEED_ARTICLE_COUNT)
    yield feed_server
    feed_server.feed = randomize_feed()


@pytest.fixture(scope="function")
def create_subscription(as_user_1, updater_feed_server):
    res = as_user_1.post("/api/subscriptions/",
                         json={"feed_url": updater_feed_server.url})
    assert res.status_code == 201, res
    return res.json


class TestOldArticlesPurge:

    @pytest.mark.parametrize("max_age_days,expected_count", [
        (60, 0),
        (-1, FEED_ARTICLE_COUNT)])
    def test_purge_max_age_days(self, max_age_days, expected_count, app,
                                create_subscription):
        with app.app_context():
            assert purge_old_articles({
                "max_age_days": max_age_days,
                "purge_unread": True,
                "subscription_id": None
            }) == expected_count

    @pytest.mark.parametrize("purge_unread,expected_count", [
        (False, 0),
        (True, FEED_ARTICLE_COUNT)])
    def test_purge_unread(self, purge_unread, expected_count, app,
                          create_subscription):
        with app.app_context():
            assert purge_old_articles({
                "max_age_days": -1,
                "purge_unread": purge_unread,
                "subscription_id": None
            }) == expected_count

    def test_purge_subscription_id(self, app, as_user_1, create_subscription):
        subscription_id = as_user_1.get("/api/subscriptions/").json[0]["id"]

        with app.app_context():
            assert purge_old_articles({
                "max_age_days": -1,
                "purge_unread": True,
                "subscription_id": 666
            }) == 0

            assert purge_old_articles({
                "max_age_days": -1,
                "purge_unread": True,
                "subscription_id": subscription_id
            }) == FEED_ARTICLE_COUNT

    def test_do_not_purge_starred(self, app, as_user_1, create_subscription):
        article_id = as_user_1.get("/api/articles/").json[0]["id"]

        res = as_user_1.put(f"/api/articles/{article_id}/star/")
        assert res.status_code == 204, res

        with app.app_context():
            assert purge_old_articles({
                "max_age_days": -1,
                "purge_unread": True,
                "subscription_id": None
            }) == FEED_ARTICLE_COUNT - 1

        res = as_user_1.delete(f"/api/articles/{article_id}/star/")
        assert res.status_code == 204, res

        with app.app_context():
            assert purge_old_articles({
                "max_age_days": -1,
                "purge_unread": True,
                "subscription_id": None
            }) == 1
