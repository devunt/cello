var socket = io('/services/message');

function init() {
    var channelList = document.getElementById('channel-list');
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
    });

    socket.on('initialized', function (data) {
        if (data.nickname) {
            current_nickname = data.nickname;
            messageInputBoxNick.innerHTML = current_nickname;
        }

        data.channels.forEach(addChannel);

        prepareInputBoxInput();
    });

    socket.on('message', function (data) {
        console.log(data);
    });

    socket.on('message-sent', function () {
        prepareInputBoxInput();
    });

    socket.on('channel-joined', function (data) {
        console.log(data);
        if (data.user == null || data.user == current_nickname) {
            data.channel.current = true;
            addChannel(data.channel);
        }
        prepareInputBoxInput();
    });

    socket.on('nick-changed', function (data) {
        console.log(data);
        if (data.old == current_nickname) {
            current_nickname = data.new;
            messageInputBoxNick.innerHTML = data.new;
        } else {
            // TODO: Change other user's nickname
        }
        prepareInputBoxInput();
    });

    socket.on('disconnect', function () {
        enableMessageInputBox(false);
    });

    messageInputBoxBtn.addEventListener('click', sendMessage);
    messageInputBoxInput.addEventListener('keypress', function (e) {
        if (e.keyCode == 13) {
            sendMessage();
        }
    });

    function getCurrentChannelName() {
        return currentChannel.getAttribute('data-channel-name');
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
        if (channelInfo.current) {
            if (currentChannel !== null) {
                currentChannel.classList.remove('current');
            }
            channel.classList.add('current');
            currentChannel = channel;
        }
        channelList.appendChild(channel);

        return channel;
    }

    function changeChannel(newChannel) {
        if (currentChannel == newChannel) {
            return;
        }
        if (!newChannel.classList.contains('channel')) {
            return;
        }

        currentChannel.classList.remove('current');
        currentChannel = newChannel;
        currentChannel.classList.add('current');
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
        if (commandHandler[command](args)) {
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
