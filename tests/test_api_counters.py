def test_ok(create_subscription, client, feed_server):
    subscription_id = create_subscription()["id"]
    res = client.get("/api/counters/")
    assert res.status_code == 200
    assert res.json[f"{subscription_id}"] == len(feed_server.feed.items)
