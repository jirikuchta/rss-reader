from flask import Blueprint, request, redirect, url_for, render_template
from flask_login import login_user, logout_user, login_required
from werkzeug.security import check_password_hash

from .models import User


views = Blueprint("views", __name__)


@views.route("/")
@login_required
def index():
    return render_template("index.html")


@views.route("/login/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            return redirect(url_for("views.login"))

        login_user(user, remember=remember)

        return redirect(url_for("views.index"))
    else:
        return render_template("login.html")


@views.route("/logout/")
def logout():
    logout_user()
    return redirect(url_for("views.login"))
