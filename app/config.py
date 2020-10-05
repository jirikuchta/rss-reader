class Config(object):
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = "sqlite:////:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class Production(Config):
    pass


class Development(Config):
    DEBUG = True
    SECRET_KEY = "dev"
    SQLALCHEMY_DATABASE_URI = "sqlite:////app/rss_reader.db"


class Testing(Config):
    TESTING = True
    SECRET_KEY = "test"
