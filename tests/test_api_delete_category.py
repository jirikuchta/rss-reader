def test_ok(create_category, client):
    cat = create_category()
    res = client.delete(f"/api/categories/{cat['id']}/")
    assert res.status_code == 204, res

    res = client.get("/api/categories/")
    assert res.status_code == 200, res
    assert len(res.json) == 0


def test_not_found(client):
    res = client.delete("/api/categories/666/", json={})
    assert res.status_code == 404, res
    assert res.json["error"]["code"] == "not_found"


def test_null_subscription_category(create_category, client, feed_server):
    category = create_category()

    res = client.post("/api/subscriptions/", json={
        "feed_url": feed_server.url, "category_id": category["id"]})
    assert res.status_code == 201, res
    assert res.json["category_id"] == category["id"]
    subscription = res.json

    res = client.delete(f"/api/categories/{category['id']}/")
    assert res.status_code == 204, res

    res = client.get(f"/api/subscriptions/{subscription['id']}/")
    assert res.status_code == 200, res
    assert res.json["category_id"] is None
