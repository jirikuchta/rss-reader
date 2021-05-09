def test_ok(client, create_subscription):
    subscription = create_subscription()
    res = client.delete(f"/api/subscriptions/{subscription['id']}/")
    assert res.status_code == 204, res


def test_not_found(client, feed_server):
    res = client.delete("/api/subscriptions/1234/")
    assert res.status_code == 404, res
    assert res.json["error"]["code"] == "not_found"
