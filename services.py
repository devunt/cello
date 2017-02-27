import functools

from flask_login import current_user
from flask_restful import Api, Resource
from flask_socketio import Namespace, SocketIO
from flask_socketio import join_room, leave_room

from models import db
from models import Channel


def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if current_user.is_authenticated:
            return f(*args, **kwargs)
    return wrapped


class ChannelService(Resource):
    def get(self):
        return {}


class MessageService(Namespace):
    def on_connect(self):
        pass

    def on_disconnect(self):
        pass

    def on_initialize(self):
        if current_user.is_authenticated:
            for channel in current_user.channels:
                print(channel)
                join_room(channel.name)
        self.emit('initialized')

    def on_join(self, name):
        channel = Channel.get(name)
        if current_user.is_authenticated:
            if channel is None:
                channel = Channel(name)
                db.session.add(channel)
            current_user.channels.add(channel)
            join_room(name)
            db.session.commit()
            data = {'channel': channel, 'user': current_user.name}
        else:
            if channel is None:
                data = {'channel': None}
            else:
                data = {'channel': name}
        self.emit('channel-joined', data)

    @authenticated_only
    def on_message(self, channel, message):
        channel = Channel.get(channel)
        if channel is None:
            return
        self.emit('message-sent')
        data = {'channel': channel, 'message': message, 'user': current_user.name}
        self.emit('message', data, room=channel, include_self=True)


api = Api()
api.add_resource(ChannelService, '/services/channel')

socketio = SocketIO()
socketio.on_namespace(MessageService('/services/message'))
