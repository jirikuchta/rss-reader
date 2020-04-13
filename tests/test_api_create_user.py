import pytest
import requests


class TestAPICreateUser:

    @pytest.mark.parametrize("data", [
        {"username": "abcd", "password": "1234", "role": "admin"},
        {"username": "abcd", "password": "1234", "role": "user"},
        {"username": "abcd", "password": "1234"}])
    def test_ok(self, data, as_admin):
        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 200
        assert res.json["status"] == "ok"

        res_data = res.json["data"]
        assert res_data is not None
        assert res_data["username"] == data["username"]
        assert res_data["role"] == data.get("role", "user")
        assert "password" not in res_data

    def test_as_user(self, as_user):
        res = as_user.post("/api/users/", data={
            "username": "abcd", "password": "1234"})
        assert res.status_code == 200
        assert res.json["status"] == "permission_denied"
        assert res.json["data"] is None

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.get("/api/users/")
        assert res.status_code == 401, res

    def test_username_unique(self, as_admin):
        data = {"username": "abcd", "password": "1234"}

        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 200
        assert res.json["status"] == "ok"

        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 200
        assert res.json["status"] == "username_taken"

    @pytest.mark.parametrize("data", [
        {"username": "", "password": "1234"},
        {"password": "1234"}])
    def test_username_required(self, data, as_admin):
        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 200
        assert res.json["status"] == "username_required"

    @pytest.mark.parametrize("data", [
        {"username": "abcd", "password": ""},
        {"username": "abcd"}])
    def test_password_required(self, data, as_admin):
        res = as_admin.post("/api/users/", data=data)
        assert res.status_code == 200
        assert res.json["status"] == "password_required"

    def test_unsuppoted_role(self, as_admin):
        res = as_admin.post("/api/users/", data={
            "username": "abcd", "password": 1234, "role": "aaa"})
        assert res.status_code == 200
        assert res.json["status"] == "unsupported_role"
