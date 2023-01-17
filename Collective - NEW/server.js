if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//DB connection modules
const mongodb = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const server = require("http").createServer(app);
const bodyParser = require('body-parser');
//var sessionstore = require('sessionstore');
var ObjectId = require('mongodb').ObjectId;

//Login handler modules
const LocalStrategy = require('passport-local').Strategy
const flash = require('express-flash');
let session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');


const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
});



app.set("socketio", io);
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
app.use(flash())
app.use(session({
    secret: 'secretSquirrel',
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    req.io = io;
    return next();
  });



app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

//Connect to MongoDB
mongodb.connect('mongodb://localhost:27017', (err, db) => {


    if (err){ throw err;}
    console.log('Connected to MongoDB');

    //Define database and collections
    let dbo = db.db('collective')
    let chats = dbo.collection('chats');
    let users = dbo.collection('users');
    let sessions = dbo.collection('sessions');

    //Passport functions    
    function initialize(passport) {
        const authenticateUser = async (email, password, done) => {
          const user = await getUserByEmail(email)
          
          if (user == null) {
            return done(null, false, { message: 'Account not found' })
          }
          try {
              sessions.insertOne({user: user, socketId: io.socket})
            if (await bcrypt.compare(password, user.password)) {
              return done(null, user)
            } else {
              return done(null, false, { message: 'Password incorrect' })
            }
          } catch (e) {
            return done(e)
          }
        }

        passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
        passport.serializeUser((user, done) => done(null, user._id))
        passport.deserializeUser((_id, done) => {
          return done(null, getUserById(_id))
        })

      }

        initialize(
            passport,
            email => users.findOne({email: email}),
            id => users.findOne({id: id})
        )

    

    app.get('/', checkAuthenticated, async (req, res) => {
        let usr = await getUserById(req.session.passport.user)
        res.render("index", {name: usr})

        });

    app.get('/login', checkNotAuthenticated, (req, res, socket) => {
           
            console.log("No session", socket.id)

        res.render("login", {message: 'Please enter your email and password'})
        });


    app.post('/login',
     checkNotAuthenticated,
      passport.authenticate('local', {failureRedirect: '/login', failureFlash: true}),
      function(req, res) {   
        res.render("index", {name: req.user.name})
        saveUser(req)
              
    });


    app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render("register.ejs")
    });

    app.post('/register', checkNotAuthenticated, async (req, res) => {
       try{
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            //console.log( hashedPassword)
            users.insertOne({name: req.body.username, email: req.body.email, password: hashedPassword, friends: []}, function(){
                res.redirect('/login')
            })

        }catch(err){
            res.redirect('/register')
            console.log(err);
        }
    });

    app.get('/users', async (req, res) => {
        
        try {
            users.find({"_id" : ObjectId(req.session.passport.user)}).toArray(function(err, result) {
                if (err) throw err;
                res.json(result[0])

            })
        } catch (error) {
            
        }

    })

      app.get("/chats", async (req, res) => {
        try {
            let usr = await users.find({"_id" : ObjectId(req.session.passport.user)}).toArray()
            chats.find({members: usr[0].name}).toArray(function(err, result) {
             if (err) throw err;
             res.json(result)
         });  
        } catch (error) {
        }
      });

    app.get("/logout", (req, res) => {
        req.logout(req.user, err => {
          if(err) return next(err);
          
          res.redirect("/login");
        });
      });
      
      function checkAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
          return next()
        }
      
        res.redirect('/login')
      }
      
      function checkNotAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
          return res.redirect('/')
        }
        next()
      }


    //Socket.io
    io.on('connection', async function (socket) {

        let chats = dbo.collection('chats');
        let messages = dbo.collection('messages');
        //let user = await getUser()
            try{
                console.log('Connected to Socket.io, socket id: ' + socket.id);

                messages.find({}).toArray(function(err, result) {
                    if (err) throw err;

                }); 

            }catch(err){
                console.log(err);
            }  
            
            //Get chat list
            socket.on('receiveChats', async (chat) => {
                let user = await getUser(socket.id)
                chats.find( { members :{ $elemMatch :{name : user} }}).toArray(function(err, result) {
                     if (err) throw err;
                io.emit('receiveChats', [chat])
                });
            });


    socket.on('loggedIn', async (user, sid) => {
        try {
            users.updateOne({"name" : user.name }, {$set: {socketId: sid}})
        } catch (error) {
            
        }
        
        });

        //Join Chat
        socket.on('joinRoom', async function(room){
            var rooms = await Array.from(socket.rooms);
            socket.leave(rooms[1])
            socket.join(room)
            //console.log(room)

            messages.find({roomName: room}).toArray(function(err, result) {
                if (err) throw err;
                //console.log(result)
                io.to(socket.id).emit('receiveMessage', result)
            });
            })

        //Get Messages
        socket.on('getMessages', async (chat) => {
            messages.find({roomName: chat}).toArray(function(err, result) {
                if (err) throw err;
                io.to(chat).emit('receiveMessage', result)
            });
        })

        //Join chat
        socket.on('loadMessages', async (chat) => {
            messages.find({chat: chat.name}).toArray(function(err, result) {
                if (err) throw err;
                io.emit('receiveMessage', result)

                messages.find({name: { $in: chat.members}}).toArray(function(err, result) {
                    if (err) throw err;
                    // io.emit('receiveChats', [chat])
                    result.forEach(element => {
                        io.to(element.socketId).emit('receiveChats', [chat])
                    });
                });


            });
        })


    socket.on('addFriend', async (user, friend) => {

        //Does the friend exist?
        users.findOne({name: friend}, function(err, result) {
            if (err) throw err;
                if(result){
                    //Does the user already have the friend?
                    users.findOne({name: user, friends: friend}, function(err, result) {
                        if (err) throw err;
                            if(result){
                                io.to(socket.id).emit('friendAdded', "Already a friend")
                            }else{
                                users.updateOne({"name" : user}, {$push: {friends: friend}})
                                io.to(socket.id).emit('friendAdded', "Friend added")
                            }
                    });
                }else{
                    io.to(socket.id).emit('friendAdded', "User does not exist")
                }
        });
    });

                
  




    socket.on('addChat', async (chat) => {
        console.log("Name: ", chat.name)
        chats.findOne({name: chat.name}, function(err, result) {
            console.log("Result: ", result)
            if (err) throw err;
                if(result){
                    console.log("Chatroom name already exists")
                    io.to(socket.id).emit('chatAdded', "Chatroom name already exists")
                }else{
                    chats.insertOne({owner: chat.user.name, name: chat.name, members: chat.members})
                    io.to(socket.id).emit('chatAdded', "Chat added")
                    io.to(socket.id).emit('receiveChats', [chat])
                }
        });
    });



        // chats.insertOne({owner: chat.user.name, name: chat.name, members: chat.members})
        // users.find({name: { $in: chat.members}}).toArray(function(err, result) {
        //     if (err) throw err;
        //     // io.emit('receiveChats', [chat])
        //     result.forEach(element => {
        //         io.to(element.socketId).emit('receiveChats', [chat])
        //     });
        // });


        //         //Does the friend exist?
        //         users.findOne({name: friend}, function(err, result) {
        //             if (err) throw err;
        //                 if(result){
        //                     //Does the user already have the friend?
        //                     users.findOne({name: user, friends: friend}, function(err, result) {
        //                         if (err) throw err;
        //                             if(result){
        //                                 io.to(socket.id).emit('friendAdded', "Already a friend")
        //                             }else{
        //                                 users.updateOne({"name" : user}, {$push: {friends: friend}})
        //                                 io.to(socket.id).emit('friendAdded', "Friend added")
        //                             }
        //                     });
        //                 }else{
        //                     io.to(socket.id).emit('friendAdded', "User does not exist")
        //                 }
        //         });



        //Send Messages
        socket.on('sendMessage', async (msg, req) => {
            // let sender = msg.sender;
            // let message = msg.message;
            // let date = msg.date;
            // let time = msg.time;
            var room = await Array.from(socket.rooms);
            console.log("test", room[1])
            try{
                messages.insertOne({sender: msg.sender, roomName: room[1], message: msg.message, date: msg.date, time: msg.time}, function(){
                    io.to(room[1]).emit('receiveMessage', [msg])
                })            
             }
            catch(err){
                console.log(err);
            }
    });

        
    async function getUser(sid){
        try {
            users.findOne({socketId: sid}, function(err, result) {
                if (err) throw err;
                return result
            })

        } catch (error) {
            
        }
    }

        //Get Messages

        // async function getMessages(chat){
        //     try {
        //         //console.log(chat)
        //         await messages.find({roomName: chat}).toArray(function(err, result) {
        //             if (err) throw err;
        //             io.to(socket.rooms[1]).emit('receiveMessage', messages)
        //             //io.to(socket.rooms[1]).emit('receiveMessage', result)
        //             //console.log(socket.id)
        //             return result
        //         });
        //     } catch (error) {
        //         console.log(error);
        //     }
        // }


        //Status function
        showStatus = function(s) {
            socket.emit('status', s);
        }
    });



    async function getUserByEmail(email){
        try {
            let result = await users.find({email: email}).toArray();
            //console.log(result[0].name)
            //let query = users.find({email : email})
            return result[0];
        } catch (error) {
            console.log(error);
        }

      }

      async function getUserById(id){
        //console.log(id)
       try {
        
        users.find({"_id" : ObjectId(id)}).toArray(async function(err, result) {
            if (err) throw err;
            //console.log(result[0].name)
            return result[0]

        })
        //console.log(user)

       } catch (error) {
        
       }

        //console.log(result)
        //console.log(result[0])
        //let query = users.find({email : email})
        
      }
      function saveUser(req){
        // passport.user = req.user;
        // let session = req.session;
        // console.log
      }
      
    server.listen(3001, () => {
        console.log('Server is running on port 3001');
      });
      
});

module.exports = app;
