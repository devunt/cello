import random

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


channel_joins = db.Table('channel_joins',
    db.Column('channel_id', db.Integer, db.ForeignKey('channel.id')),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
)


class User(UserMixin, db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    tokens = db.relationship('OAuthToken', backref='user')

    def __init__(self):
        rnum = random.randint(1, 10000)
        self.name = f'User{rnum}'


class OAuthToken(db.Model):
    __tablename__ = 'oauth_token'
    __table_args__ = (db.Index('provider_token_index', 'provider', 'token', unique=True),)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    provider = db.Column(db.String, nullable=False)
    token = db.Column(db.String, nullable=False)

    def __init__(self, provider, token, user):
        self.provider = provider
        self.token = token
        self.user = user


class Channel(db.Model):
    __tablename__ = 'channel'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True, index=True)
    topic = db.Column(db.String)
    users = db.relationship('User', secondary=channel_joins, backref=db.backref('channels', lazy='dynamic'))

    def __init__(self, name):
        self.name = name

    @classmethod
    def get(cls, name):
        return cls.query.filter_by(name=name).first()
