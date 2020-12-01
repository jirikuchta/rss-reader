class TestAPIListArticles:

    def test_ok(self, client, create_subscription, feed_server):
        create_subscription()
        res = client.get("/api/articles/")
        assert res.status_code == 200
        assert res.json is not None
        assert len(res.json) == len(feed_server.feed.items)
