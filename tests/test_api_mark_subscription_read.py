class TestAPIMarkSubscriptionRead:

    def test_ok(self, client, create_subscription):
        subscription = create_subscription()

        res = client.get(f"/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) != 0

        res = client.put(f"/api/subscriptions/{subscription['id']}/read/")
        assert res.status_code == 204, res

        res = client.get(f"/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) == 0

    def test_not_found(self, client, feed_server):
        res = client.put(f"/api/subscriptions/666/read/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
