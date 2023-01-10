const mongodb = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const server = require("http").createServer(app);
//const io = require("socket.io")(server, { cors: { origin: "*" } });
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});


server.listen(3001, () => {
    console.log('Server is running on port 3001');
  });


//Connect to MongoDB
mongodb.connect('mongodb://localhost:27017', (err, db) => {
    if (err){ throw err;
    }
    let dbo = db.db('collective')
    let chats = dbo.collection('chats');
    let users = dbo.collection('users');
    
    console.log('Connected to MongoDB');


    //Socket.io connection
    io.on('connection', (socket) => {
        let messages = dbo.collection('messages');
            //try{
                console.log('Connected to Socket.io, socket id: ' + socket.id);

                messages.find({}).toArray(function(err, result) {
                    if (err) throw err;
                    // result.forEach(element => {
                    //     console.log(element.name)
                    // });
                    
                socket.emit('receiveMessage', result)
            });
           // }catch(err){
               // console.log(err);
            //}  
    
    //Receive messages
    socket.on('receiveMessage', (msg) => {
        
        messages.find({}).toArray(function(err, result) {
            if (err) throw err;            
        io.emit('receiveMessage', result)
        });
    });


        //Send Messages
        socket.on('sendMessage', (msg) => {

            let sender = msg.sender;
            let chat_id = msg.chat_id;
            let message = msg.message;
            let date = msg.date;
            let time = msg.time;

            //try{
                messages.insertOne({sender: sender, chat_id: chat_id, message: message, date: date, time: time}, function(){
                    io.emit('receiveMessage', [msg])
                })
                
            //socket.emit('sendMessage', msg);
               
                
            // }
            // catch(err){
            //     console.log(err);
            // }
            

        });      
        

        //Status function
        showStatus = function(s) {
            socket.emit('status', s);
        }
    });


});
      
