def test_ok(client, create_subscription, feed_server):
    create_subscription()

    res = client.get("/api/articles/")
    assert res.status_code == 200, res
    assert len(res.json) != 0
    article_id = res.json[0]["id"]

    res = client.patch(f"api/articles/{article_id}/",
                       json={"read": True, "starred": True})
    assert res.status_code == 200, res
    assert res.json["read"] is True
    assert res.json["starred"] is True

    res = client.patch(f"api/articles/{article_id}/",
                       json={"read": False, "starred": False})
    assert res.status_code == 200, res
    assert res.json["read"] is False
    assert res.json["starred"] is False


def test_not_found(client):
    res = client.patch("api/articles/666/")
    assert res.status_code == 404, res
    assert res.json["error"]["code"] == "not_found"
