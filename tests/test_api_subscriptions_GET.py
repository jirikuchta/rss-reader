class TestAPIListSubscriptions:

    def test_ok(self, as_user, feed_server):
        res = as_user.get("/api/subscriptions/")
        assert res.status_code == 200
        assert len(res.json) == 0

        res = as_user.post(
            "/api/subscriptions/", json={"uri": feed_server.url})
        assert res.status_code == 201

        res = as_user.get("/api/subscriptions/")
        assert res.status_code == 200
        assert len(res.json) == 1
        assert res.json[0]["id"] is not None
        assert res.json[0]["title"] == feed_server.feed.title
        assert res.json[0]["uri"] == feed_server.feed.link

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/subscriptions/")
        assert res.status_code == 401, res
