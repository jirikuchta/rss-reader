import pytest


class TestAPICreateUser:

    @pytest.mark.parametrize("data", [
        {"username": "abcd", "password": "1234", "role": "admin"},
        {"username": "abcd", "password": "1234", "role": "user"},
        {"username": "abcd", "password": "1234"}])
    def test_ok(self, data, as_admin):
        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 201, res
        assert res.json is not None
        assert res.json["username"] == data["username"]
        assert res.json["role"] == data.get("role", "user")
        assert "password" not in res.json

    def test_as_user(self, as_user):
        res = as_user.post("/api/users/", data={
            "username": "abcd", "password": "1234"})
        assert res.status_code == 403, res
        assert res.json is None

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/users/")
        assert res.status_code == 401, res

    def test_username_unique(self, as_admin):
        data = {"username": "abcd", "password": "1234"}

        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 201

        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 422
        assert res.json["errors"][0]["code"] == "already_exists"

    @pytest.mark.parametrize("data", [
        {"username": "", "password": "1234"},
        {"password": "1234"}])
    def test_username_required(self, data, as_admin):
        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 422
        assert res.json["errors"][0]["code"] == "missing_field"
        assert res.json["errors"][0]["field"] == "username"

    @pytest.mark.parametrize("data", [
        {"username": "abcd", "password": ""},
        {"username": "abcd"}])
    def test_password_required(self, data, as_admin):
        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 422
        assert res.json["errors"][0]["code"] == "missing_field"
        assert res.json["errors"][0]["field"] == "password"

    def test_unsuppoted_role(self, as_admin):
        res = as_admin.post("/api/users/", data={
            "username": "abcd", "password": 1234, "role": "aaa"})
        assert res.status_code == 422
        assert res.json["errors"][0]["code"] == "invalid_field"
        assert res.json["errors"][0]["field"] == "role"
