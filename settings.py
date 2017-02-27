class Config:
    DEBUG = False
    TESTING = False
    SECRET_KEY = 'q345v7n89p4wbvtnyoq3c4bvt78o3bvt6n9pq34bvt7y89p'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = True

    FACEBOOK_CONSUMER_KEY = ''
    FACEBOOK_CONSUMER_SECRET = ''

    GITHUB_CONSUMER_KEY = ''
    GITHUB_CONSUMER_SECRET = ''

    GOOGLE_CONSUMER_KEY = ''
    GOOGLE_CONSUMER_SECRET = ''

    TWITTER_CONSUMER_KEY = 'N4qd1lRyiFEOugIsQ3SF2wefd'
    TWITTER_CONSUMER_SECRET = 'HgOLb77b2DAhtEyq9KQBHS1P1zO7K0gKAaWMoR98iSBsWUfdq5'


class ProductionConfig(Config):
    pass


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
