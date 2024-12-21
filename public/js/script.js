const socket = io();

var username;

var messageContainer, sendForm, messageInput;
var channelList, newChannelBtn;

var format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

//Check special characters and spaces in strings (adding channels and usernames)
function checkValidName(string) {
    return (string.length <= 32 && !format.test(string));
}

// Called when document fully loads
function init(e) {
    messageContainer = document.getElementById('message-container');
    sendForm = document.getElementById('send-form');
    messageInput = document.getElementById('message-input');

    channelList = document.getElementById('channel-list');
    newChannelBtn = document.getElementById('new-channel-btn');

    sendForm.addEventListener('submit', sendMessage);
    newChannelBtn.addEventListener('click', createChannel);

    username = getUsername();
    socket.emit('new-user', username);

    socket.on('get-channel', (channel) => {
        appendChannel(channel.name);
    });

    socket.on('receive-message', (message) => {
        appendMessage(message);
    });

    socket.on('switch-channel', (channel) => {
        clearMessages();
        let newMessages = channel.messages
        console.log(channel);
        newMessages.forEach(message => {
            appendMessage(message);
        });

        appendMessage('You have joined the ' + channel.name + ' channel.');
        socket.emit('send-message', username + ' has joined the channel.');
    });
}

//Prompt user for usernames
function getUsername() {
    let username;

    while (!username) {
        let input = prompt('Username:');

        if (input) {
            if (checkValidName(input)) {
                username = input
                break;
            }
        }

        alert('Invalid Username!');
    }

    return username;
}

//Prompt user when creating a channel
function getChannelName() {
    let input = prompt('Channel Name:');

    if (input && checkValidName(input)) {
        return input;
    }
    else {
        alert('Invalid Channel Name!');
        return null;
    }
}

//Called when user submits a message
function sendMessage(e) {
    e.preventDefault();
    let message = messageInput.value;
    if (message) {
        message = username + ': ' + message;
        messageInput.value = '';

        appendMessage(message);
        socket.emit('send-message', message);
    }
}

//Called when user creates channel
function createChannel(e) {
    let channelName = getChannelName();

    if (channelName) {
        appendChannel(channelName);
        socket.emit('new-channel', channelName);
    }
}

function joinChannel(e) {
    socket.emit('join-channel', e.target.innerHTML);
}

//Editing elements

function appendMessage(message) {
    let newMessage = document.createElement('div');
    newMessage.className = 'message';
    newMessage.innerHTML = message;

    messageContainer.append(newMessage);
}

function appendChannel(channelName) {
    let newChannel = document.createElement('div');
    newChannel.className = 'channel';
    newChannel.innerHTML = channelName;

    newChannel.addEventListener('click', joinChannel);

    channelList.append(newChannel);
}

function clearMessages() {
    let messages = document.getElementsByClassName('message');
    let nodes = Array.prototype.slice.call(messages, 0);
    nodes.forEach(element => {
        element.remove();
    });
}

window.onload = init;