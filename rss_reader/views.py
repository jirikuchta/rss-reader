from flask import Flask, Blueprint, request, redirect, url_for, render_template
from flask_login import login_user, logout_user, login_required  # type: ignore
from typing import Union
from werkzeug.security import check_password_hash
from werkzeug.wrappers import Response

from rss_reader.models import db, User
from rss_reader.logger import before_request, after_request


views = Blueprint("views", __name__)


def init(app: Flask) -> None:
    views.before_request(before_request)
    views.after_request(after_request)

    app.register_blueprint(views)


@views.route("/")
@login_required
def index() -> str:
    return render_template("index.html")


@views.route("/login/", methods=["GET", "POST"])
def login() -> Union[Response, str]:

    def render_error(error: str):
        return render_template("login.html", data=request.form, error=error)

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False

        if not username:
            return render_error("Please enter username.")

        if not password:
            return render_error("Please enter password.")

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            return render_error("Unknown username or invalid password.")

        login_user(user, remember=remember)

        return redirect(url_for("views.index"))
    else:
        return render_template("login.html", data={})


@views.route("/logout/")
def logout() -> Response:
    logout_user()
    return redirect(url_for("views.login"))


@views.route("/signup/", methods=["GET", "POST"])
def signup() -> Union[Response, str]:

    def render_error(error: str):
        return render_template("signup.html", data=request.form, error=error)

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username:
            return render_error("Username is required.")

        if not password:
            return render_error("Password is required.")

        if User.query.filter_by(username=username).first():
            return render_error("That username is taken.")

        user = User(username=username, password=password)

        db.session.add(user)
        db.session.commit()

        login_user(user)

        return redirect(url_for("views.index"))
    else:
        return render_template("signup.html", data={})
