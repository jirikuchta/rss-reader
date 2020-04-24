class TestAPIDeleteSubscription:

    def test_ok(self, as_user, feed_server):
        res = as_user.post(
            "/api/subscriptions/", json={"uri": feed_server.url})
        assert res.status_code == 201

        res = as_user.delete(f"/api/subscriptions/{res.json['id']}/")
        assert res.status_code == 204, res

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.delete("/api/subscriptions/1234/")
        assert res.status_code == 401, res

    def test_not_found(self, as_user, feed_server):
        res = as_user.delete(f"/api/subscriptions/1234/")
        assert res.status_code == 404, res
        assert res.json["errors"][0]["code"] == "not_found"
