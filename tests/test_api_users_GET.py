class TestAPIListUsers:

    def test_as_admin(self, as_admin):
        res = as_admin.get("/api/users/")
        assert res.status_code == 200, res
        assert res.json is not None

    def test_as_user(self, as_user):
        res = as_user.get("/api/users/")
        assert res.status_code == 403, res

    def test_as_anonymous(sef, as_anonymous):
        res = as_anonymous.get("/api/users/")
        assert res.status_code == 401, res

    def test_passwords_not_exposed(self, as_admin):
        res = as_admin.get("/api/users/")
        assert "password" not in res.json[0]
