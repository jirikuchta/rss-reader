class TestAPIUpdateSubscription:

    def test_ok(self, create_category, create_subscription, client, rand_str):
        subscription = create_subscription()
        category = create_category()
        res = client.patch(
            f"/api/subscriptions/{subscription['id']}/",
            json={"category_id": category["id"], "title": rand_str})
        assert res.status_code == 200, res
        assert res.json["title"] == rand_str
        assert res.json["category_id"] == category["id"]

    def test_category_not_found(self, create_subscription, client):
        subscription = create_subscription()
        res = client.patch(f"/api/subscriptions/{subscription['id']}/",
                           json={"category_id": 666})
        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "invalid_field"
        assert res.json["error"]["field"] == "category_id"
        assert res.json["error"]["msg"] == "category not found"

    def test_not_found(self, client):
        res = client.patch("/api/subscriptions/666/", json={})
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
