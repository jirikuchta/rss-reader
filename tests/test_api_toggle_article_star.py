class TestAPIToggleArticleStar:

    def test_ok(self, as_user_1, create_subscription, feed_server):
        create_subscription(as_user_1)

        res = as_user_1.get("/api/articles/")
        assert res.status_code == 200, res
        assert len(res.json) != 0
        article_id = res.json[0]["id"]

        # star
        res = as_user_1.put(f"api/articles/{article_id}/star/")
        res.status_code == 204, res

        res = as_user_1.get(f"/api/articles/{article_id}/")
        assert res.status_code == 200, res
        assert res.json["starred"] is not None

        # unstar
        res = as_user_1.delete(f"api/articles/{article_id}/star/")
        res.status_code == 204, res

        res = as_user_1.get(f"/api/articles/{article_id}/")
        assert res.status_code == 200, res
        assert res.json["starred"] is None

    def test_not_found(self, as_user_1):
        res = as_user_1.put(f"api/articles/666/star/")
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
