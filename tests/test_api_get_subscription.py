class TestAPIGetSubscription:

    def test_ok(self, as_user_1, create_subscription):
        subscription = create_subscription(as_user_1)
        res = as_user_1.get(f"/api/subscriptions/{subscription['id']}/")
        assert res.status_code == 200, res
        assert res.json is not None
        assert res.json["id"] == subscription["id"]
        assert res.json["title"] == subscription["title"]
        assert res.json["feed_url"] == subscription["feed_url"]

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/subscriptions/1234/")
        assert res.status_code == 401, res

    def test_not_found(self, as_user_1, as_user_2, create_subscription):
        not_owned_subs = create_subscription(as_user_2)
        res = as_user_1.get(f"/api/subscriptions/{not_owned_subs['id']}/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
