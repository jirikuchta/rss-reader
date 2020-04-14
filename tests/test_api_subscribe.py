from tests.mocks.atom_feed import MockAtomFeed, MockAtomLink


class TestAPISubscribe:

    def test_ok(self, as_user, feed_server):
        res = as_user.post("/api/subscriptions/",
                           json={"uri": feed_server.url})
        assert res.status_code == 201
        assert res.json["title"] == feed_server.feed.title
        assert len(res.json["items"]) == len(feed_server.feed.items)
