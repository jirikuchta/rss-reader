class TestAPIUpdateUser:

    def test_ok(self, as_user_1, rand_str):
        res = as_user_1.patch("/api/users/", json={
            "username": rand_str,
            "password": rand_str})
        assert res.status_code == 200, res
        assert res.json["username"] == rand_str

    def test_already_exists(self, create_user, as_user_1, rand_str):
        create_user(rand_str, rand_str)
        res = as_user_1.patch("/api/users/", json={"username": rand_str})
        assert res.status_code == 409, res
        assert res.json["error"]["code"] == "already_exists"

    def test_as_anonymous(self, create_user, as_anonymous):
        res = as_anonymous.patch("/api/users/")
        assert res.status_code == 401, res
