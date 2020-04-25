from tests.mocks.rss_feed import MockRSSFeed


class TestAPISubscribe:

    def test_ok(self, as_user, feed_server):
        res = as_user.post("/api/subscriptions/",
                           json={"uri": feed_server.url})
        assert res.status_code == 201
        assert res.json["id"] is not None
        assert res.json["title"] == feed_server.feed.title
        assert res.json["uri"] == feed_server.feed.link

    def test_as_anonymous(self, as_anonymous, feed_server):
        res = as_anonymous.post("/api/subscriptions/",
                                json={"uri": feed_server.url})
        assert res.status_code == 401, res

    def test_bad_request(self, as_user, feed_server):
        res = as_user.post("/api/subscriptions/",
                           data={"uri": feed_server.url})
        assert res.status_code == 400, res

    def test_missing_uri(self, as_user, feed_server):
        res = as_user.post("/api/subscriptions/", json={})
        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "missing_field"
        assert res.json["error"]["field"] == "uri"

    def test_parser_error(self, as_user, feed_server):
        feed_server.feed = MockRSSFeed(title=None, link=None)  # invalid feed
        res = as_user.post("/api/subscriptions/",
                           json={"uri": feed_server.url})
        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "parser_error"

    def test_already_exists(self, as_user, feed_server):
        res = as_user.post("/api/subscriptions/",
                           json={"uri": feed_server.url})
        assert res.status_code == 201, res

        res = as_user.post("/api/subscriptions/",
                           json={"uri": feed_server.url})
        assert res.status_code == 409, res
        assert res.json["error"]["code"] == "already_exists"
