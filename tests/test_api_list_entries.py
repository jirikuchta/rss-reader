class TestAPIListArticles:

    def test_ok(self, as_user, create_subscription, feed_server):
        create_subscription(as_user)
        res = as_user.get("/api/entries/")
        assert res.status_code == 200
        assert res.json is not None
        assert len(res.json) == len(feed_server.feed.items)
