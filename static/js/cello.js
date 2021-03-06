var socket = io('/services/message');

function init() {
    var channelList = document.getElementById('channel-list');
    var messageListContainer = document.getElementById('message-list-container');
    var channelTitle = document.getElementById('channel-title');
    var messageInputBoxNick = document.getElementById('message-inputbox-nick');
    var messageInputBox = document.getElementById('message-inputbox');
    var messageInputBoxInput = document.getElementById('message-inputbox-input');
    var messageInputBoxBtn = document.getElementById('message-inputbox-btn');
    var messageActionHolder = document.getElementById('message-action-placeholder');
    var currentChannel = null;
    var current_nickname = "";

    socket.on('connect', function () {
        socket.emit('initialize');
    });

    socket.on('disconnect', function() {
        enableMessageInputBox(false);
        addSystemAnnouncement('Disconnected from the server.');
    });

    socket.on('initialized', function (data) {
        if (data.nickname) {
            current_nickname = data.nickname;
            messageInputBoxNick.innerText = current_nickname;

            data.channels.forEach(addChannel);

            prepareInputBoxInput();
        }

        addSystemAnnouncement('Connected to the server.');

        if (window.location.hash) {
            processCommand('join', [window.location.hash]);
        }
    });

    socket.on('message', function (data) {
        addMessage(data.channel, data.user, data.message, data.hash);
    });

    socket.on('message-edited', function (data) {
        var message = document.querySelector('[data-hash="' + data.hash + '"]');
        var messageText = message.querySelector('.message-text');
        messageText.innerText = data.message;
        prepareInputBoxInput();
    });

    socket.on('message-deleted', function (data) {
        var message = document.querySelector('[data-hash="' + data.hash + '"]');
        message.parentNode.removeChild(message);
    });

    socket.on('message-sent', function () {
        prepareInputBoxInput();
    });

    socket.on('channel-joined', function (data) {
        if (data.user == null || data.user == current_nickname) {
            if (data.user == null && authenticated) {
                return;
            }
            data.channel.current = true;
            var channel = addChannel(data.channel);
            changeChannel(channel);
            addSystemMessage(data.channel.name, 'Joined into ' + data.channel.name);
            prepareInputBoxInput();
        } else {
            addSystemMessage(data.channel.name, data.user + ' joined ' + data.channel.name);
        }
    });

    socket.on('channel-parted', function (data) {
        console.log(data);
        if (data.user == current_nickname) {
            removeChannel(data.channel);
            var channel = document.querySelector('.channel');
            if (channel) {
                changeChannel(channel);
            }
            prepareInputBoxInput();
        } else {
            addSystemMessage(data.channel.name, data.user + ' left ' + data.channel.name);
        }
    });

    socket.on('nick-changed', function (data) {
        if (data.old == current_nickname) {
            current_nickname = data.new;
            messageInputBoxNick.innerText = data.new;
        } else {
            addSystemAnnouncement(data.old + ' changed their nickname to ' + data.new);
            // TODO: Change other user's nickname
        }
        prepareInputBoxInput();
    });

    socket.on('error', function (data) {
        addSystemMessage(getCurrentChannelName(), data.message);
        prepareInputBoxInput();
    });

    messageInputBoxBtn.addEventListener('click', sendMessage);
    messageInputBoxInput.addEventListener('keypress', function (e) {
        if (e.keyCode == 13) {
            var hash = messageInputBoxInput.getAttribute('data-editing-hash');
            if (hash) {
                editMessage(hash);
            } else {
                sendMessage();
            }
        }
    });

    function addMessage(channelName, nick, text, hash) {
        var time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric'});
        var message = document.createElement('div');
        var messageTime = document.createElement('div');
        var messageNick = document.createElement('div');
        var messageText = document.createElement('div');

        message.classList.add('message');
        messageTime.classList.add('message-time');
        messageNick.classList.add('message-nick');
        messageText.classList.add('message-text');

        messageTime.innerText = time;
        messageNick.innerText = nick;
        messageText.innerText = text;

        message.appendChild(messageTime);
        message.appendChild(messageNick);
        message.appendChild(messageText);

        if (nick == current_nickname) {
            var messageAction = messageActionHolder.cloneNode(true);
            messageAction.querySelector('.message-edit').addEventListener('click', function() {
                messageInputBoxInput.value = messageText.textContent;
                messageInputBoxInput.setAttribute('data-editing-hash', hash);
                messageInputBoxInput.focus();
            });
            messageAction.querySelector('.message-delete').addEventListener('click', function() {
                socket.emit('message_delete', getCurrentChannelName(), hash);
            });
            messageAction.classList.remove('hidden');
            message.appendChild(messageAction);
        }

        message.setAttribute('data-hash', hash);

        var messageLists = [];
        if (channelName == '*') {
            messageLists = document.querySelectorAll('.message-list');
        } else {
            messageLists = [document.getElementById(getMessageListId(channelName))];
        }

        messageLists.forEach(function(messageList) {
            messageList.appendChild(message.cloneNode(true));
            messageList.scrollIntoView(false);
        });
    }

    function addSystemMessage(channelName, message) {
        addMessage(channelName, '*', message, '*');
    }

    function addSystemAnnouncement(message) {
        addMessage('*', '*', message, '*');
    }

    function getCurrentChannelName() {
        if (currentChannel) {
            return currentChannel.getAttribute('data-channel-name');
        } else {
            return '#default';
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
            return existingChannel;
        }

        var channel = document.createElement('li');
        channel.setAttribute('data-channel-name', channelInfo.name);
        channel.addEventListener('click', function (e) {
            changeChannel(e.target);
        });
        channel.classList.add('channel');
        channel.innerText = channelInfo.name;
        channelList.appendChild(channel);

        var messageList = document.createElement('div');
        messageList.id = getMessageListId(channelInfo.name)
        messageList.setAttribute('data-channel-name', channelInfo.name);
        messageList.classList.add('message-list');
        messageList.classList.add('hidden');
        messageListContainer.appendChild(messageList);

        if (channelInfo.current) {
            changeChannel(channel);
        }

        return channel;
    }

    function removeChannel(channelInfo) {
        var channel = document.querySelector('[data-channel-name="' + channelInfo.name + '"]');
        if (!channel) {
            return;
        }

        channel.parentNode.removeChild(channel);

        var messageList = document.getElementById(getMessageListId(channelInfo.name));
        messageList.parentNode.removeChild(messageList);

        channelTitle.innerText = '';
        currentChannel = null;
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
        channelTitle.innerText = channelName;
        if (authenticated) {
            socket.emit('channel_change', channelName);
        }

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
            socket.emit('message', getCurrentChannelName(), message);
        }
    }

    function editMessage(hash) {
        var message = messageInputBoxInput.value;
        socket.emit('message', getCurrentChannelName(), message, hash)
    }

    function processCommand(command, args) {
        var handler = commandHandler[command];
        if (!handler) {
            addSystemMessage('No such command');
            enableMessageInputBox(true);
        } else if (handler(args, getCurrentChannelName())) {
            enableMessageInputBox(true);
        }
    }

    function prepareInputBoxInput() {
        messageInputBoxInput.value = '';
        messageInputBoxInput.setAttribute('data-editing-hash', '');
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
