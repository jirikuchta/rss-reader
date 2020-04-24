class TestAPIDeleteUser:

    def test_as_anonymous(sef, create_user, as_anonymous):
        res = as_anonymous.patch(f"/api/users/{create_user()['id']}/")
        assert res.status_code == 401, res

    def test_not_found(self, as_admin):
        res = as_admin.patch("/api/users/666/", json={})
        assert res.status_code == 404, res

    def test_last_admin_forbidden(self, as_admin, admin_id):
        res = as_admin.patch(f"/api/users/{admin_id}/", json={"role": "user"})
        assert res.status_code == 403, res
