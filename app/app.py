from flask import Flask

from api import init as init_api
from models import init as init_db
from views import init as init_views
from lib.config import init as init_config
from lib.logger import init as init_logger

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static")

init_config(app)
init_logger(app)
init_db(app)
init_views(app)
init_api(app)

app.logger.info("Started successfully.")
app.logger.debug("Application config: \n" +
                 "\n".join([f"{k}: {app.config[k]}" for k in app.config]))
