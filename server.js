const {Server} = require('socket.io');
const express = require('express');
const http = require('http');
const { send } = require('process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.use(express.static('public'));

//Chat room
users = {};
channels = {};

function AddChannel(name) {
    channels[name] = new Channel(name);
}

function AddUser(id, name) {
    users[id] = new User(id, name);
}

function removeUser(id) {
    users[id] = null;
}

class User {
    constructor(id, name) {
        this.id = id;
        this.username = name;
        this.currentChannel = 'Default';
    }

    switchChannel(channel) {
        this.currentChannel = channel;
    }
}

class Channel {
    constructor(name) {
        this.name = name;
        this.messages = [];
    }
    
    addMessage(message) {
        this.messages.push(message);
    }
}

AddChannel('Default');

function sendMessageInChannel(socket, channel, message) {
    for (key in users) {
        if (users[key].currentChannel == channel && key != socket.id) {
            socket.to(key).emit('receive-message', message);
        }
    }

    channels[users[socket.id].currentChannel].addMessage(message);
}

//Handle socket connection
io.on('connection', (socket) => {
    socket.on('new-user', (name) => {
        AddUser(socket.id, name);
        for (let key in channels) {
            console.log(key);
            socket.emit('get-channel', channels[key]);
        }
        socket.emit('switch-channel', channels['Default']);
    });

    socket.on('new-channel', (name) => {
        console.log(name);
        AddChannel(name);
        socket.broadcast.emit('get-channel', channels[name]);
    });

    socket.on('send-message', (message) => {
        sendMessageInChannel(socket, users[socket.id].currentChannel, message);
    });

    socket.on('join-channel', (channel) => {
        for (key in channels) {
            if (key == channel) {
                sendMessageInChannel(socket, users[socket.id].currentChannel, users[socket.id].username + ' has left this channel.');
                users[socket.id].switchChannel(channel);    
                socket.emit('switch-channel', channels[channel]);
            }
        }
    });
});

//Render html
app.get('/', (req, res) => {
    res.render('index.html', {
        title: 'Chat Room'
    });
});

//Start server
server.listen(3000, () => {
    console.log('Server running on port 3000');
});