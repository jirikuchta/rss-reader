class TestAPIMarkCategoryRead:

    def test_ok(self, create_category, create_subscription, client):
        cat = create_category()
        create_subscription(cat["id"])

        res = client.get(f"/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) != 0

        res = client.put(f"/api/categories/{cat['id']}/read/")
        assert res.status_code == 204, res

        res = client.get(f"/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) == 0

    def test_not_found(self, client):
        res = client.put("/api/categories/666/read/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
