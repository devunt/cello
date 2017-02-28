var commandHandler = {
    join: function (args) {
        var channelName = args[0];
        socket.emit('join', channelName);
    },

    part: function (args, channelName) {
        socket.emit('part', channelName);
    },

    nick: function (args) {
        var newNick = args[0];
        socket.emit('nick', newNick);
    }
};