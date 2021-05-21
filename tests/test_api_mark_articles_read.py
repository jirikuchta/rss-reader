def test_mark_all_read(create_subscription, client, feed_server):
    subscription_id = create_subscription()["id"]

    res = client.post("/api/articles/mark-read/", json={"all": True})
    assert res.status_code == 204

    res = client.get("/api/counters/")
    assert res.status_code == 200
    assert str(subscription_id) not in res.json


def test_mark_read(create_subscription, client, feed_server):
    subscription_id = create_subscription()["id"]

    res = client.get(f"/api/articles/?subscription_id={subscription_id}")
    assert res.status_code == 200
    aid = res.json[0]["id"]

    res = client.post("/api/articles/mark-read/", json={"ids": [aid]})
    assert res.status_code == 204

    res = client.get("/api/counters/")
    assert res.status_code == 200
    assert res.json[str(subscription_id)] == len(feed_server.feed.items) - 1
