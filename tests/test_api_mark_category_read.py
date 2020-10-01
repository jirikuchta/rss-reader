class TestAPIMarkCategoryRead:

    def test_ok(self, create_category, create_subscription, as_user_1):
        cat = create_category(as_user_1)
        create_subscription(as_user_1, cat["id"])

        res = as_user_1.get(f"/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) != 0

        res = as_user_1.put(f"/api/categories/{cat['id']}/read/")
        assert res.status_code == 204, res

        res = as_user_1.get(f"/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) == 0

    def test_not_found(self, create_category, as_user_2, as_user_1):
        not_owned_cat = create_category(as_user_2)
        res = as_user_1.put(f"/api/categories/{not_owned_cat['id']}/read/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
