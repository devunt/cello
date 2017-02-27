var socket = io('/services/message');

function init() {
    var messageInputBox = document.getElementById('message-inputbox');
    var messageInputBoxInput = document.getElementById('message-inputbox-input');
    var messageInputBoxBtn = document.getElementById('message-inputbox-btn');
    var channel = "";

    socket.on('connect', function () {
        socket.emit('initialize');
    });

    socket.on('initialized', function () {
        setMessageInputBoxStatus(true);
    });

    socket.on('message', function (data) {
        console.log(data);
    });

    socket.on('message-sent', function () {
        setMessageInputBoxStatus(true);
        messageInputBoxInput.value = '';
        messageInputBoxInput.focus();
    });

    socket.on('disconnect', function () {
        setMessageInputBoxStatus(false);
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

    function setMessageInputBoxStatus(enable) {
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
