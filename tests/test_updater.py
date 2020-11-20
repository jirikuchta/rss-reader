# from rss_reader.updater import purge_old_articles


class TestPurge:

    @staticmethod
    def create_subscription(as_user_1, feed_server):
        res = as_user_1.post("/api/subscriptions/",
                             json={"feed_url": feed_server.url})
        assert res.status_code == 201, res
        return res.json

    # def test_purge_expired(self, app, as_user_1, feed_server):
    #     self.create_subscription(as_user_1, feed_server)
    #     with app.app_context():
    #         assert purge_old_articles({
    #             "max_age_days": -1,
    #             "purge_unread": False,
    #             "subscription_id": None
    #         }) == len(feed_server.feed.items)

    # def test_purge_expired_read(self, app, as_user_1, feed_server):
    #     self.create_subscription(as_user_1, feed_server)
    #     with app.app_context():
    #         assert purge_old_articles({
    #             "max_age_days": -1,
    #             "purge_unread": False,
    #             "subscription_id": None
    #         }) == len(feed_server.feed.items)

    # def test_purge_expired_unread_included(self, app, as_user_1, feed_server):
    #     self.create_subscription(as_user_1, feed_server)
    #     with app.app_context():
    #         assert purge_old_articles({
    #             "max_age_days": -1,
    #             "purge_unread": True,
    #             "subscription_id": None
    #         }) == len(feed_server.feed.items)


class TestUpdate:
    pass
