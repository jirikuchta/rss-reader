class TestAPIUpdateCategory:

    def test_ok(self, create_category, as_user_1):
        cat = create_category(as_user_1)

        res = as_user_1.patch(
            f"/api/categories/{cat['id']}/", json={"title": cat["title"]})
        assert res.status_code == 200, res
        assert res.json["title"] == cat["title"]

        res = as_user_1.patch(
            f"/api/categories/{cat['id']}/", json={"title": "new title"})
        assert res.status_code == 200, res
        assert res.json["title"] == "new title"

    def test_no_conflict_with_other_user_cat(
            self, create_category, as_user_2, as_user_1):
        not_owned_cat = create_category(as_user_2)
        cat = create_category(as_user_1)
        res = as_user_1.patch(f"/api/categories/{cat['id']}/",
                            json={"title": not_owned_cat["title"]})
        assert res.status_code == 200, res

    def test_no_data(self, as_user_1, create_category):
        cat = create_category(as_user_1)
        res = as_user_1.patch(f"/api/categories/{cat['id']}/")
        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "bad_request"

    def test_not_found(self, create_category, as_user_2, as_user_1):
        not_owned_cat = create_category(as_user_2)
        res = as_user_1.patch(f"/api/categories/{not_owned_cat['id']}/", json={})
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"

    def test_already_exists(self, create_category, as_user_1):
        cat_1 = create_category(as_user_1)
        cat_2 = create_category(as_user_1)
        res = as_user_1.patch(f"/api/categories/{cat_1['id']}/",
                            json={"title": cat_2["title"]})
        assert res.status_code == 409, res
        assert res.json["error"]["code"] == "already_exists"
