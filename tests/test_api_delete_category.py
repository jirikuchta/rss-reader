class TestAPIDeleteCategory:

    def test_ok(self, create_category, as_user_1):
        cat = create_category(as_user_1)
        res = as_user_1.delete(f"/api/categories/{cat['id']}/")
        assert res.status_code == 204, res

        res = as_user_1.get(f"/api/categories/")
        assert res.status_code == 200, res
        assert len(res.json) == 0

    def test_not_found(self, create_category, as_user_2, as_user_1):
        not_owned_cat = create_category(as_user_2)
        res = as_user_1.delete(
            f"/api/categories/{not_owned_cat['id']}/", json={})
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"

    def test_null_subscription_category(self, create_category, as_user_1,
                                        feed_server):
        category = create_category(as_user_1)

        res = as_user_1.post("/api/subscriptions/", json={
            "feed_url": feed_server.url, "category_id": category["id"]})
        assert res.status_code == 201, res
        assert res.json["category_id"] == category["id"]
        subscription = res.json

        res = as_user_1.delete(f"/api/categories/{category['id']}/")
        assert res.status_code == 204, res

        res = as_user_1.get(f"/api/subscriptions/{subscription['id']}/")
        assert res.status_code == 200, res
        assert res.json["category_id"] is None
