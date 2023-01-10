require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
//const http = require('http');
const server = require("http").createServer(app);
//const { Server } = require("socket.io");
const io = require("socket.io")(server, { cors: { origin: "*" } });


mongoose.connect(process.env.DATABASE_URL), {useNewUrlParser: true};
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

app.use(express.json());

const usersRouter = require('./routes/users.js');
app.use('/', usersRouter);

const messagesRouter = require('./routes/messages.js');
app.use('/', messagesRouter);

const chatsRouter = require('./routes/chats.js');
app.use('/', chatsRouter);


server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

io.on('connection', (socket) => {
  console.log(socket.id);
  
  socket.on('message', (msg) => {
    io.socket.post('/messages', msg, function (resData, jwRes) {
      jwRes.statusCode; // => 200
    });
    
  });
});
//io.socket.post('/messages', { name: 'Timmy Mendez' }, function (resData, jwRes) {