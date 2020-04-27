class TestAPIUpdateSubscription:

    def test_ok(self, create_category, create_subscription, as_user, rand_str):
        subscription = create_subscription(as_user)
        category = create_category(as_user)

        res = as_user.patch(
            f"/api/subscriptions/{subscription['id']}/",
            json={"category_id": category["id"], "title": rand_str})

        assert res.status_code == 200, res
        assert res.json["title"] == rand_str
        assert res.json["category"]["id"] == category["id"]

    def test_category_not_found(
            self, create_category, create_subscription, as_user, as_admin):
        not_owned_category = create_category(as_admin)
        subscription = create_subscription(as_user)

        res = as_user.patch(
            f"/api/subscriptions/{subscription['id']}/",
            json={"category_id": not_owned_category["id"]})

        assert res.status_code == 400, res
        assert res.json["error"]["code"] == "invalid_field"
        assert res.json["error"]["field"] == "category_id"
        assert res.json["error"]["msg"] == "category not found"

    def test_as_anonymous(self, as_anonymous):
        res = as_anonymous.patch("/api/subscriptions/1234/")
        assert res.status_code == 401, res

    def test_not_found(self, as_user, as_admin, create_subscription):
        not_owned_subs = create_subscription(as_admin)
        res = as_user.patch(
            f"/api/subscriptions/{not_owned_subs['id']}/", json={})
        assert res.status_code == 404, res
        assert res.json["error"]["code"] == "not_found"
