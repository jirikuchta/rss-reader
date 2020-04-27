class TestAPIDeleteSubscription:

    def test_ok(self, as_user, create_subscription):
        subscription = create_subscription(as_user)
        res = as_user.delete(f"/api/subscriptions/{subscription['id']}/")
        assert res.status_code == 204, res

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.delete("/api/subscriptions/1234/")
        assert res.status_code == 401, res

    def test_not_found(self, as_user, feed_server):
        res = as_user.delete(f"/api/subscriptions/1234/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
