from rss_reader.lib.models import User
from werkzeug.security import generate_password_hash


class TestUserModel:

    def test_test(self, session):
        user = User(username="admin",
                    password=generate_password_hash("admin", method="sha256"))

        session.add(user)
        session.commit()

        assert user.id == 1
