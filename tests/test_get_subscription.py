from tests.mocks.rss_feed import MockRSSFeed


class TestAPIGetSubscription:

    def test_ok(self, as_user, feed_server):
        subscription = as_user.put(
            "/api/subscriptions/", json={"uri": feed_server.url}).json
        res = as_user.get(f"/api/subscriptions/{subscription['id']}/")
        assert res.status_code == 200, res
        assert res.json is not None
        assert res.json["id"] == subscription["id"]
        assert res.json["title"] == subscription["title"]
        assert res.json["uri"] == subscription["uri"]

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/subscriptions/1234/")
        assert res.status_code == 401, res

    def test_not_found(self, as_user, as_admin, feed_server):
        subscription_id = as_admin.put(
            "/api/subscriptions/", json={"uri": feed_server.url}).json["id"]
        res = as_user.get(f"/api/subscriptions/{subscription_id}/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
