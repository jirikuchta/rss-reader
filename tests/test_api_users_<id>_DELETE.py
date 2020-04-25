class TestAPIDeleteUser:

    def test_as_admin(self, create_user, as_admin):
        res = as_admin.delete(f"/api/users/{create_user()['id']}/")
        assert res.status_code == 204, res

    def test_as_user(self, create_user, as_user):
        res = as_user.delete(f"/api/users/{create_user()['id']}/")
        assert res.status_code == 403, res

    def test_as_anonymous(sef, create_user, as_anonymous):
        res = as_anonymous.delete(f"/api/users/{create_user()['id']}/")
        assert res.status_code == 401, res

    def test_not_found(self, as_admin):
        res = as_admin.delete("/api/users/666/")
        assert res.status_code == 404, res

    def test_last_admin_forbidden(self, as_admin, admin_id):
        res = as_admin.delete(f"/api/users/{admin_id}/")
        assert res.status_code == 403, res
        assert res.json["error"]["code"] == "last_admin"
