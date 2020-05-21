class TestAPIDeleteCategory:

    def test_ok(self, create_category, as_user):
        cat = create_category(as_user)
        res = as_user.delete(f"/api/categories/{cat['id']}/")
        assert res.status_code == 204, res

        res = as_user.get(f"/api/categories/")
        assert res.status_code == 200, res
        assert len(res.json) == 0

    def test_not_found(self, create_category, as_admin, as_user):
        not_owned_cat = create_category(as_admin)
        res = as_user.delete(
            f"/api/categories/{not_owned_cat['id']}/", json={})
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"

    def test_null_subscription_category(self, create_category, as_user,
                                        feed_server):
        category = create_category(as_user)

        res = as_user.post("/api/subscriptions/", json={
            "uri": feed_server.url, "categoryId": category["id"]})
        assert res.status_code == 201, res
        assert res.json["categoryId"] == category["id"]
        subscription = res.json

        res = as_user.delete(f"/api/categories/{category['id']}/")
        assert res.status_code == 204, res

        res = as_user.get(f"/api/subscriptions/{subscription['id']}/")
        assert res.status_code == 200, res
        assert res.json["categoryId"] is None
