def test_ok(client, feed_server, create_subscription):
    res = client.get("/api/subscriptions/")
    assert res.status_code == 200
    assert len(res.json) == 0

    create_subscription()

    res = client.get("/api/subscriptions/")
    assert res.status_code == 200
    assert len(res.json) == 1
    assert res.json[0]["id"] is not None
    assert res.json[0]["title"] == feed_server.feed.title
    assert res.json[0]["web_url"] == feed_server.feed.link
    assert res.json[0]["feed_url"] == feed_server.url
