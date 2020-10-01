class TestAPICreateCategory:

    def test_ok(self, as_user_1, rand_str):
        res = as_user_1.post("/api/categories/", json={"title": rand_str})
        assert res.status_code == 201
        assert res.json["id"] is not None
        assert res.json["title"] == rand_str

    def test_no_conflict_with_other_user_cat(
            self, create_category, as_user_2, as_user_1):
        not_owned_cat = create_category(as_user_2)
        res = as_user_1.post(
            "/api/categories/", json={"title": not_owned_cat["title"]})
        assert res.status_code == 201, res

    def test_bad_request(self, as_user_1):
        res = as_user_1.post("/api/categories/")
        assert res.status_code == 400, res

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.post("/api/categories/")
        assert res.status_code == 401, res

    def test_missing_title(self, as_user_1):
        res = as_user_1.post("/api/categories/", json={})
        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "missing_field"
        assert res.json["error"]["field"] == "title"

    def test_already_exists(self, as_user_1, rand_str):
        res = as_user_1.post("/api/categories/", json={"title": rand_str})
        assert res.status_code == 201, res

        res = as_user_1.post("/api/categories/", json={"title": rand_str})
        assert res.status_code == 409, res
        assert res.json["error"]["code"] == "already_exists"
