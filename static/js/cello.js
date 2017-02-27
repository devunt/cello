var socket = io('/services/message');

function init() {
    var messageInputBoxNick = document.getElementById('message-inputbox-nick');
    var messageInputBox = document.getElementById('message-inputbox');
    var messageInputBoxInput = document.getElementById('message-inputbox-input');
    var messageInputBoxBtn = document.getElementById('message-inputbox-btn');
    var channel = "";
    var nickname = "";

    socket.on('connect', function () {
        socket.emit('initialize');
    });

    socket.on('disconnect', function() {
        enableMessageInputBox(false);
    });

    socket.on('initialized', function (data) {
        if (data.nickname) {
            nickname = data.nickname;
            messageInputBoxNick.innerHTML = nickname;
        }
        if (data.last_channel) {
            channel = data.last_channel;
        }

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
        if (data.user == null || data.user == nickname) {
            channel = data.channel;
        }
        prepareInputBoxInput();
    });

    socket.on('nick-changed', function (data) {
        console.log(data);
        if (data.old == nickname) {
            nickname = data.new;
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

    function sendMessage() {
        enableMessageInputBox(false);

        var message = messageInputBoxInput.value;
        if (message.indexOf('/') == 0) {
            var split = message.substr(1).split(' ');
            var args = split.slice(1);
            processCommand(split[0], args);
        } else {
            socket.emit('message', channel, messageInputBoxInput.value);
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
