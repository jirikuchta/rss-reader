class TestAPIGetCategory:

    def test_ok(self, create_category, as_user):
        cat = create_category(as_user)
        res = as_user.get(f"/api/categories/{cat['id']}/")
        assert res.status_code == 200, res
        assert res.json["id"] == cat["id"]
        assert res.json["title"] == cat["title"]

    def test_not_found(self, create_category, as_admin, as_user):
        not_owned_cat = create_category(as_admin)
        res = as_user.get(f"/api/categories/{not_owned_cat['id']}/")
        assert res.status_code == 404, res

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/subscriptions/")
        assert res.status_code == 401, res
