import pytest

def test_ok(client, create_subscription, feed_server):
    create_subscription()
    res = client.get("/api/articles/")
    assert res.status_code == 200
    assert res.json is not None
    assert len(res.json) == len(feed_server.feed.items)


def test_subscription_filter(client, create_subscription, feed_server):
    res = client.get("/api/articles/?subscription_id=666")
    assert res.status_code == 200
    assert len(res.json) == 0

    subscription_id = create_subscription()["id"]
    res = client.get(f"/api/articles/?subscription_id={subscription_id}")
    assert res.status_code == 200
    assert len(res.json) == len(feed_server.feed.items)


def test_category_filter(
        client, create_category, create_subscription, feed_server):
    category_id = create_category()["id"]

    res = client.get(f"/api/articles/?category_id={category_id}")
    assert res.status_code == 200
    assert len(res.json) == 0

    create_subscription(category_id=category_id)
    res = client.get(f"/api/articles/?category_id={category_id}")
    assert res.status_code == 200
    assert len(res.json) == len(feed_server.feed.items)


def test_bookmarked_only_filter(client, create_subscription):
    create_subscription()
    article_id = client.get("/api/articles/").json[0]["id"]
    client.patch(f"/api/articles/{article_id}/", json={"bookmarked": True})

    res = client.get("/api/articles/?bookmarked_only=true")
    assert res.status_code == 200
    assert len(res.json) == 1
    assert res.json[0]["id"] == article_id


def test_unread_only_filter(client, create_subscription, feed_server):
    create_subscription()
    article_id = client.get("/api/articles/").json[0]["id"]
    client.patch(f"/api/articles/{article_id}/", json={"read": True})

    res = client.get("/api/articles/?unread_only=true")
    assert res.status_code == 200
    assert len(res.json) == len(feed_server.feed.items) - 1


def test_limit(client, create_subscription, feed_server):
    create_subscription()
    res = client.get("/api/articles/?limit=2")
    assert res.status_code == 200
    assert len(res.json) == 2


def test_offset(client, create_subscription, feed_server):
    create_subscription()
    all_articles = client.get("/api/articles/").json

    res = client.get("/api/articles/?offset=1")
    assert res.status_code == 200
    assert len(res.json) == len(feed_server.feed.items) - 1
    assert res.json[0]["id"] == all_articles[1]["id"]


@pytest.mark.parametrize("order,index", [("desc", 0), ("asc", -1)])
def test_order(order, index, client, create_subscription, feed_server):
    create_subscription()
    all_articles = client.get("/api/articles/").json

    res = client.get(f"/api/articles/?order={order}")
    assert res.status_code == 200
    assert len(res.json) == len(feed_server.feed.items)
    assert res.json[0]["id"] == all_articles[index]["id"]