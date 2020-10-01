class TestAPIListSubscriptions:

    def test_ok(self, as_user_1, feed_server, create_subscription):
        res = as_user_1.get("/api/subscriptions/")
        assert res.status_code == 200
        assert len(res.json) == 0

        create_subscription(as_user_1)

        res = as_user_1.get("/api/subscriptions/")
        assert res.status_code == 200
        assert len(res.json) == 1
        assert res.json[0]["id"] is not None
        assert res.json[0]["title"] == feed_server.feed.title
        assert res.json[0]["web_url"] == feed_server.feed.link
        assert res.json[0]["feed_url"] == feed_server.url

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/subscriptions/")
        assert res.status_code == 401, res
