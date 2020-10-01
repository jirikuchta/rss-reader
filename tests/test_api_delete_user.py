class TestAPIDeleteUser:

    def test_ok(self, create_user, get_client, rand_str):
        create_user(rand_str, rand_str)
        client = get_client(rand_str, rand_str)
        res = client.delete("/api/users/")
        assert res.status_code == 204, res

    def test_as_anonymous(sef, as_anonymous):
        res = as_anonymous.delete(f"/api/users/")
        assert res.status_code == 401, res
