def test_ok(create_category, client):
    cat = create_category()
    res = client.get("/api/categories/")
    assert res.status_code == 200, res
    assert len(res.json) == 1
    assert res.json[0]["id"] == cat["id"]
    assert res.json[0]["title"] == cat["title"]


def test_no_category_ok(client):
    res = client.get("/api/categories/")
    assert res.status_code == 200, res
    assert len(res.json) == 0
