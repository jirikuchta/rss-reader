class TestAPIListArticles:

    def test_ok(self, as_user, feed_server):
        res = as_user.post(
            "/api/subscriptions/", json={"uri": feed_server.url})
        assert res.status_code == 201

        res = as_user.get("/api/articles/")
        assert res.status_code == 200
        assert res.json is not None
        assert len(res.json) == len(feed_server.feed.items)
