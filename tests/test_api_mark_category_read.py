class TestAPIMarkCategoryRead:

    def test_ok(self, create_category, create_subscription, as_user):
        cat = create_category(as_user)
        create_subscription(as_user, cat["id"])

        res = as_user.get(f"/api/entries/")
        assert res.status_code == 200, res
        assert len(res.json) != 0

        res = as_user.put(f"/api/categories/{cat['id']}/read/")
        assert res.status_code == 204, res

        res = as_user.get(f"/api/entries/")
        assert res.status_code == 200, res
        assert len(res.json) == 0

    def test_not_found(self, create_category, as_admin, as_user):
        not_owned_cat = create_category(as_admin)
        res = as_user.put(f"/api/categories/{not_owned_cat['id']}/read/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
