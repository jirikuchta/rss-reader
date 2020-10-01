class TestAPIMarkSubscriptionRead:

    def test_ok(self, as_user_1, create_subscription):
        subscription = create_subscription(as_user_1)

        res = as_user_1.get(f"/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) != 0

        res = as_user_1.put(f"/api/subscriptions/{subscription['id']}/read/")
        assert res.status_code == 204, res

        res = as_user_1.get(f"/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) == 0

    def test_not_found(self, as_user_1, feed_server):
        res = as_user_1.put(f"/api/subscriptions/1234/read/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
