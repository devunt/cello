var socket = io('/services/message');

function init() {
    var channelList = document.getElementById('channel-list');
    var messageListContainer = document.getElementById('message-list-container');
    var channelTitle = document.getElementById('channel-title');
    var messageInputBoxNick = document.getElementById('message-inputbox-nick');
    var messageInputBox = document.getElementById('message-inputbox');
    var messageInputBoxInput = document.getElementById('message-inputbox-input');
    var messageInputBoxBtn = document.getElementById('message-inputbox-btn');
    var currentChannel = null;
    var current_nickname = "";

    socket.on('connect', function () {
        socket.emit('initialize');
    });

    socket.on('disconnect', function() {
        enableMessageInputBox(false);
        addSystemMessage('You are disconnected.');
    });

    socket.on('initialized', function (data) {
        if (data.nickname) {
            current_nickname = data.nickname;
            messageInputBoxNick.innerHTML = current_nickname;
        }

        data.channels.forEach(addChannel);

        addSystemMessage('Connected to the server.');
        prepareInputBoxInput();

        if (window.location.hash) {
            processCommand('join', [window.location.hash]);
        }
    });

    socket.on('message', function (data) {
        if (data.channel == getCurrentChannelName()) {
            addMessage(data.user, data.message);
        }
    });

    socket.on('message-sent', function () {
        prepareInputBoxInput();
    });

    socket.on('channel-joined', function (data) {
        if (data.user == null || data.user == current_nickname) {
            data.channel.current = true;
            var channel = addChannel(data.channel);
            changeChannel(channel);
            addSystemMessage('Joined into ' + data.channel.name);
        }
        prepareInputBoxInput();
    });

    socket.on('nick-changed', function (data) {
        if (data.old == current_nickname) {
            current_nickname = data.new;
            messageInputBoxNick.innerHTML = data.new;
        } else {
            addSystemMessage(data.old + ' changed their nickname to ' + data.new);
            // TODO: Change other user's nickname
        }
        prepareInputBoxInput();
    });

    messageInputBoxBtn.addEventListener('click', sendMessage);
    messageInputBoxInput.addEventListener('keypress', function (e) {
        if (e.keyCode == 13) {
            sendMessage();
        }
    });

    function addMessage(nick, text) {
        var time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric'});
        var message = document.createElement('div');
        var messageTime = document.createElement('div');
        var messageNick = document.createElement('div');
        var messageText = document.createElement('div');

        message.classList.add('message');
        messageTime.classList.add('message-time');
        messageNick.classList.add('message-nick');
        messageText.classList.add('message-text');

        messageTime.innerHTML = time;
        messageNick.innerHTML = nick;
        messageText.innerHTML = text;

        message.appendChild(messageTime);
        message.appendChild(messageNick);
        message.appendChild(messageText);

        getCurrentMessageList().appendChild(message);
    }

    function addSystemMessage(message) {
        addMessage('*', message);
    }

    function getCurrentChannelName() {
        if (currentChannel) {
            return currentChannel.getAttribute('data-channel-name');
        } else {
            return null;
        }
    }

    function getCurrentMessageList() {
        var channelName = getCurrentChannelName();
        if (channelName === null) {
            return null;
        }

        return document.getElementById(getMessageListId(channelName));
    }

    function getMessageListId(channelName) {
        return 'message-list-' + channelName.substr(1);
    }

    function addChannel(channelInfo) {
        var existingChannel = document.querySelector('[data-channel-name="' + channelInfo.name + '"]');
        if (existingChannel !== null) {
            changeChannel(existingChannel);
            return existingChannel;
        }

        var channel = document.createElement('li');
        channel.setAttribute('data-channel-name', channelInfo.name);
        channel.addEventListener('click', function (e) {
            changeChannel(e.target);
        });
        channel.classList.add('channel');
        channel.innerHTML = channelInfo.name;
        channelList.appendChild(channel);

        var messageList = document.createElement('div');
        messageList.id = getMessageListId(channelInfo.name)
        messageList.setAttribute('data-channel-name', channelInfo.name);
        messageList.classList.add('hidden');
        messageListContainer.appendChild(messageList);

        if (channelInfo.current) {
            changeChannel(channel);
        }

        return channel;
    }

    function changeChannel(newChannel) {
        if (currentChannel == newChannel) {
            return;
        }
        if (!newChannel.classList.contains('channel')) {
            return;
        }
        if (currentChannel !== null) {
            currentChannel.classList.remove('current');
            getCurrentMessageList().classList.add('hidden');
        }
        currentChannel = newChannel;
        currentChannel.classList.add('current');
        getCurrentMessageList().classList.remove('hidden');

        var channelName = getCurrentChannelName();
        channelTitle.innerHTML = channelName;
        messageInputBoxInput.focus();
    }

    function sendMessage() {
        enableMessageInputBox(false);

        var message = messageInputBoxInput.value;
        if (message.indexOf('/') == 0) {
            var split = message.substr(1).split(' ');
            var args = split.slice(1);
            processCommand(split[0], args);
        } else {
            socket.emit('message', getCurrentChannelName(), messageInputBoxInput.value);
        }
    }

    function processCommand(command, args) {
        var handler = commandHandler[command];
        if (!handler) {
            addSystemMessage('No such command');
            enableMessageInputBox(true);
        } else if (handler(args)) {
            enableMessageInputBox(true);
        }
    }

    function prepareInputBoxInput() {
        messageInputBoxInput.value = '';
        enableMessageInputBox(true);
        messageInputBoxInput.focus();
    }

    function enableMessageInputBox(enable) {
        if (enable) {
            messageInputBoxInput.removeAttribute('disabled');
            messageInputBoxBtn.removeAttribute('disabled');
            messageInputBox.classList.remove('disabled');
        } else {
            messageInputBoxInput.setAttribute('disabled', '');
            messageInputBoxBtn.setAttribute('disabled', '');
            messageInputBox.classList.add('disabled');
        }
    }
}

function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

ready(init);
