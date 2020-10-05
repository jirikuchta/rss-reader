from flask import Blueprint, request, redirect, url_for, render_template
from flask_login import login_user, logout_user, login_required
from typing import Union
from werkzeug.security import check_password_hash
from werkzeug.wrappers import Response

from app.models import db, User


views = Blueprint("views", __name__)


@views.route("/")
@login_required
def index() -> str:
    return render_template("index.html")


@views.route("/login/", methods=["GET", "POST"])
def login() -> Union[Response, str]:
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False
        error = None

        if not username:
            error = "Please enter username."

        if not password:
            error = "Please enter password."

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            error = "Unknown username or invalid password."

        if error is not None:
            return render_template("login.html", data=request.form,
                                   error=error)

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
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username:
            return render_template("signup.html",
                                   error="Username is required.",
                                   data=request.form)

        if not password:
            return render_template("signup.html",
                                   error="Password is required.",
                                   data=request.form)

        if User.query.filter_by(username=username).first():
            return render_template("signup.html",
                                   error="That username is taken.",
                                   data=request.form)

        user = User(username=username, password=password)

        db.session.add(user)
        db.session.commit()

        login_user(user)

        return redirect(url_for("views.index"))
    else:
        return render_template("signup.html", data={})
