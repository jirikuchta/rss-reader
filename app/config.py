import os


def get_config():
    env = os.environ["FLASK_ENV"].title()
    if env == "Production":
        return Production()
    if env == "Development":
        return Development()
    if env == "Testing":
        return Testing()


class Config(object):
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = "sqlite:////:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    RUN_UPDATER = True
    SUBSCRIPTION_UPDATE_INTERVAL = 15


class Production(Config):
    pass


class Development(Config):
    DEBUG = True
    SECRET_KEY = "dev"
    SQLALCHEMY_DATABASE_URI = "sqlite:////app/rss_reader.db"
    SUBSCRIPTION_UPDATE_INTERVAL = 1


class Testing(Config):
    TESTING = True
    SECRET_KEY = "test"
    RUN_UPDATER = False
