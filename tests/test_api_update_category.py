def test_ok(create_category, client):
    cat = create_category()

    res = client.patch(f"/api/categories/{cat['id']}/",
                       json={"title": cat["title"]})
    assert res.status_code == 200, res
    assert res.json["title"] == cat["title"]

    res = client.patch(f"/api/categories/{cat['id']}/",
                       json={"title": "new title"})
    assert res.status_code == 200, res
    assert res.json["title"] == "new title"


def test_no_data(client, create_category):
    cat = create_category()
    res = client.patch(f"/api/categories/{cat['id']}/")
    assert res.status_code == 400, res
    assert res.json["error"]["code"] == "bad_request"


def test_not_found(client):
    res = client.patch("/api/categories/666/", json={})
    assert res.status_code == 404, res
    assert res.json["error"]["code"] == "not_found"


def test_already_exists(create_category, client):
    cat_1 = create_category()
    cat_2 = create_category()
    res = client.patch(f"/api/categories/{cat_1['id']}/",
                       json={"title": cat_2["title"]})
    assert res.status_code == 409, res
    assert res.json["error"]["code"] == "already_exists"
