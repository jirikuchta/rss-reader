from tests.mocks.rss_feed import MockRSSFeed


class TestAPIListSubscription:

    def test_ok(self, as_user, feed_server):
        res = as_user.get("/api/subscriptions/")
        assert res.status_code == 200
        assert res.json is None

        res = as_user.post("/api/subscriptions/",
                           json={"uri": feed_server.url})
        assert res.status_code == 201

        res = as_user.get("/api/subscriptions/")
        assert res.status_code == 200
        assert res.json is not None
        assert len(res.json) == 1

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/subscriptions/")
        assert res.status_code == 401, res
