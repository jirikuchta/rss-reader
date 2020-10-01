class TestAPIListArticles:

    def test_ok(self, as_user_1, create_subscription, feed_server):
        create_subscription(as_user_1)
        res = as_user_1.get("/api/articles/")
        assert res.status_code == 200
        assert res.json is not None
        assert len(res.json) == len(feed_server.feed.items)
