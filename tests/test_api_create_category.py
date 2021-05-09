def test_ok(client, rand_str):
    res = client.post("/api/categories/", json={"title": rand_str})
    assert res.status_code == 201
    assert res.json["id"] is not None
    assert res.json["title"] == rand_str


def test_bad_request(client):
    res = client.post("/api/categories/")
    assert res.status_code == 400, res


def test_missing_title(client):
    res = client.post("/api/categories/", json={})
    assert res.status_code == 400, res
    assert res.json["error"]["code"] == "missing_field"
    assert res.json["error"]["field"] == "title"


def test_already_exists(client, rand_str):
    res = client.post("/api/categories/", json={"title": rand_str})
    assert res.status_code == 201, res

    res = client.post("/api/categories/", json={"title": rand_str})
    assert res.status_code == 409, res
    assert res.json["error"]["code"] == "already_exists"
