def test_ok(client, create_subscription, feed_server):
    create_subscription()

    res = client.get("/api/articles/")
    assert res.status_code == 200, res
    assert len(res.json) != 0
    article_id = res.json[0]["id"]

    # read
    res = client.put(f"api/articles/{article_id}/read/")
    assert res.status_code == 204, res

    res = client.get(f"/api/articles/{article_id}/")
    assert res.status_code == 200, res
    assert res.json["read"] is True

    # unread
    res = client.delete(f"api/articles/{article_id}/read/")
    res.status_code == 204, res

    res = client.get(f"/api/articles/{article_id}/")
    assert res.status_code == 200, res
    assert res.json["read"] is False


def test_not_found(client):
    res = client.put("api/articles/666/read/")
    assert res.status_code == 404, res
    assert res.json["error"]["code"] == "not_found"
