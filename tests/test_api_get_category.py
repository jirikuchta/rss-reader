class TestAPIGetCategory:

    def test_ok(self, create_category, client):
        cat = create_category()
        res = client.get(f"/api/categories/{cat['id']}/")
        assert res.status_code == 200, res
        assert res.json["id"] == cat["id"]
        assert res.json["title"] == cat["title"]

    def test_not_found(self, client):
        res = client.get("/api/categories/666/")
        assert res.status_code == 404, res
