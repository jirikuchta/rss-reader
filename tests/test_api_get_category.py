class TestAPIGetCategory:

    def test_ok(self, create_category, as_user_1):
        cat = create_category(as_user_1)
        res = as_user_1.get(f"/api/categories/{cat['id']}/")
        assert res.status_code == 200, res
        assert res.json["id"] == cat["id"]
        assert res.json["title"] == cat["title"]

    def test_not_found(self, create_category, as_user_2, as_user_1):
        not_owned_cat = create_category(as_user_2)
        res = as_user_1.get(f"/api/categories/{not_owned_cat['id']}/")
        assert res.status_code == 404, res

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/categories/666/")
        assert res.status_code == 401, res
