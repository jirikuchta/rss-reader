from tests.mocks.atom_feed import MockAtomFeed, MockAtomLink


class TestAPISubscribe:

    def test_ok(self, as_user, feed_server):
        res = as_user.post("/api/subscriptions/",
                           data={"uri": feed_server.url})
        assert res.status_code == 200
        assert res.json["status"] == "ok"
        assert res.json["data"]["title"] == feed_server.feed.title
