def test_ok(create_category, create_subscription, client):
    category_id = create_category()["id"]
    create_subscription(category_id)

    res = client.put(f"/api/categories/{category_id}/read/")
    assert res.status_code == 204, res

    res = client.get(f"/api/articles/?category_id={category_id}")
    assert res.status_code == 200, res
    assert all([a["read"] for a in res.json]) is True


def test_not_found(client):
    res = client.put("/api/categories/666/read/")
    assert res.status_code == 404, res
    assert res.json["error"]["code"] == "not_found"
