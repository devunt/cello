var commandHandler = {
    join: function (args) {
        var channelName = args[0];
        socket.emit('join', channelName);
    },

    nick: function (args) {
        var newNick = args[0];
        socket.emit('nick', newNick);
    }
};