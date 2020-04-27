import pytest  # type: ignore


class TestAPIDeleteCategory:

    def test_ok(self, create_category, as_user):
        cat = create_category(as_user)
        res = as_user.delete(f"/api/categories/{cat['id']}/")
        assert res.status_code == 204, res

    def test_not_found(self, create_category, as_admin, as_user):
        not_owned_cat = create_category(as_admin)
        res = as_user.delete(
            f"/api/categories/{not_owned_cat['id']}/", json={})
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"

    @pytest.mark.skip
    def test_null_subscription_category(self, create_category, as_user):
        pass
