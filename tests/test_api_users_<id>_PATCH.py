class TestAPIUpdateUser:

    def test_as_admin(self, create_user, as_admin, admin_id):
        create_user(role="admin")  # to prevent "last_admin" error
        res = as_admin.patch(
            f"/api/users/{admin_id}/",
            json={"username": "bob", "password": "abc1234", "role": "user"})
        assert res.status_code == 200, res
        assert res.json["username"] == "bob"
        assert res.json["role"] == "user"

    def test_as_user(self, as_user, user_id):
        res = as_user.patch(
            f"/api/users/{user_id}/",
            json={"username": "bob", "password": "abc1234", "role": "user"})
        assert res.status_code == 200, res
        assert res.json["username"] == "bob"
        assert res.json["role"] == "user"

    def test_already_exists(self, create_user, as_admin):
        user_1 = create_user()
        user_2 = create_user()

        res = as_admin.patch(f"/api/users/{user_2['id']}/",
                             json={"username": user_1["username"]})
        assert res.status_code == 409, res
        assert res.json["error"]["code"] == "already_exists"

    def test_as_anonymous(self, create_user, as_anonymous):
        res = as_anonymous.patch(f"/api/users/{create_user()['id']}/")
        assert res.status_code == 401, res

    def test_not_found(self, as_admin):
        res = as_admin.patch("/api/users/666/", json={})
        assert res.status_code == 404, res

    def test_user_role_change_forbidden(self, as_user, user_id):
        res = as_user.patch(f"/api/users/{user_id}/", json={"role": "admin"})
        assert res.status_code == 403, res

    def test_last_admin_role_change_forbidden(self, as_admin, admin_id):
        res = as_admin.patch(f"/api/users/{admin_id}/", json={"role": "user"})
        assert res.status_code == 403, res
        assert res.json["error"]["code"] == "last_admin"
