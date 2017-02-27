import functools

from flask_login import current_user
from flask_restful import Api, Resource
from flask_socketio import Namespace, SocketIO
from flask_socketio import emit, join_room, leave_room

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
        data = {}
        data['authenticated'] = current_user.is_authenticated
        if current_user.is_authenticated:
            data['nickname'] = current_user.name
            if current_user.last_channel is not None:
                data['last_channel'] = current_user.last_channel.name
            data['channels'] = []
            for channel in current_user.channels:
                join_room(channel.name)
                data['channels'].append(channel.name)
        emit('initialized', data)

    def on_join(self, channel_name):
        channel = Channel.get(channel_name)
        if current_user.is_authenticated:
            if channel is None:
                channel = Channel(channel_name)
                db.session.add(channel)
            if channel not in current_user.channels:
                current_user.channels.append(channel)
                join_room(channel_name)
            current_user.last_channel = channel
            db.session.commit()
            data = {'channel': channel_name, 'user': current_user.name}
        else:
            if channel is None:
                data = {'channel': None}
            else:
                data = {'channel': channel_name}
        emit('channel-joined', data, room=channel_name, include_self=True)

    @authenticated_only
    def on_nick(self, new_nick):
        old = current_user.name
        current_user.name = new_nick
        db.session.commit()
        data = {'old': old, 'new': new_nick}
        emit('nick-changed', data, broadcast=True, include_self=True)

    @authenticated_only
    def on_message(self, channel_name, message):
        channel = Channel.get(channel_name)
        if channel is None:
            return
        emit('message-sent')
        data = {'channel': channel_name, 'message': message, 'user': current_user.name}
        emit('message', data, room=channel_name, include_self=True)


api = Api()
api.add_resource(ChannelService, '/services/channel')

socketio = SocketIO()
socketio.on_namespace(MessageService('/services/message'))
