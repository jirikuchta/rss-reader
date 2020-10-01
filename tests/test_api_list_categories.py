class TestAPIListCategories:

    def test_ok(self, create_category, as_user_1):
        cat = create_category(as_user_1)
        res = as_user_1.get(f"/api/categories/")
        assert res.status_code == 200, res
        assert len(res.json) == 1
        assert res.json[0]["id"] == cat["id"]
        assert res.json[0]["title"] == cat["title"]

    def test_no_category_ok(self, as_user_1):
        res = as_user_1.get("/api/categories/")
        assert res.status_code == 200, res
        assert len(res.json) == 0

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/categories/")
        assert res.status_code == 401, res
