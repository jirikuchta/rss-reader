def test_ok(client, create_subscription):
    subscription_id = create_subscription()["id"]

    res = client.put(f"/api/subscriptions/{subscription_id}/read/")
    assert res.status_code == 204, res

    res = client.get(f"/api/articles/?subscription_id={subscription_id}")
    assert res.status_code == 200, res
    assert all([a["read"] for a in res.json]) is True


def test_not_found(client, feed_server):
    res = client.put("/api/subscriptions/666/read/")
    assert res.status_code == 404, res
    assert res.json["error"]["code"] == "not_found"
