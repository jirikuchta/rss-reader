def test_ok(client, create_subscription):
    subscription = create_subscription()
    res = client.get(f"/api/subscriptions/{subscription['id']}/")
    assert res.status_code == 200, res
    assert res.json is not None
    assert res.json["id"] == subscription["id"]
    assert res.json["title"] == subscription["title"]
    assert res.json["feed_url"] == subscription["feed_url"]


def test_not_found(client):
    res = client.get("/api/subscriptions/666/")
    assert res.status_code == 404, res
    assert res.json["error"]["code"] == "not_found"
