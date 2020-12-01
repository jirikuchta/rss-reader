from tests.mocks.rss_feed import MockRSSFeed


class TestAPISubscribe:

    def test_ok(self, client, feed_server, create_category):
        category = create_category()
        res = client.post("/api/subscriptions/", json={
            "feed_url": feed_server.url, "category_id": category["id"]})
        assert res.status_code == 201
        assert res.json["id"] is not None
        assert res.json["title"] == feed_server.feed.title
        assert res.json["web_url"] == feed_server.feed.link
        assert res.json["feed_url"] == feed_server.url
        assert res.json["category_id"] == category["id"]

    def test_bad_request(self, client):
        res = client.post("/api/subscriptions/")
        assert res.status_code == 400, res

    def test_missing_uri(self, client):
        res = client.post("/api/subscriptions/", json={})
        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "missing_field"
        assert res.json["error"]["field"] == "feed_url"

    def test_parser_error(self, client, feed_server):
        feed_server.feed = MockRSSFeed(title=None, link=None)  # invalid feed
        res = client.post("/api/subscriptions/",
                          json={"feed_url": feed_server.url})
        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "parser_error"

    def test_already_exists(self, client, feed_server):
        res = client.post("/api/subscriptions/",
                          json={"feed_url": feed_server.url})
        assert res.status_code == 201, res

        res = client.post("/api/subscriptions/",
                          json={"feed_url": feed_server.url})
        assert res.status_code == 409, res
        assert res.json["error"]["code"] == "already_exists"

    def test_category_not_found(self, client, feed_server):
        res = client.post("/api/subscriptions/", json={
            "feed_url": feed_server.url,
            "category_id": 666})

        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "invalid_field"
        assert res.json["error"]["field"] == "category_id"
        assert res.json["error"]["msg"] == "category not found"
