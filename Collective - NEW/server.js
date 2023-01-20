if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//DB connection modules
const mongodb = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const server = require("http").createServer(app);
const bodyParser = require('body-parser');
const ObjectId = require('mongodb').ObjectId;

//Login handler modules
const LocalStrategy = require('passport-local').Strategy
const flash = require('express-flash');
const session = require('express-session');
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
    let dbo = db.db('test')
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

    
    //API Routes
    app.get('/', checkAuthenticated, async (req, res) => {

        let usr = await getUserById(req.session.passport.user)
        res.render("index", {name: usr})

        });

    app.get('/login', checkNotAuthenticated, (req, res) => {

        res.render("login", {message: 'Please enter your email and password'})
        });

    app.post('/login',checkNotAuthenticated, passport.authenticate('local', {failureRedirect: '/login', failureFlash: true}), function(req, res) {   

        res.render("index", {name: req.user.name})
        });


    app.get('/register', checkNotAuthenticated, (req, res) => {

        res.render("register.ejs")
        });

    app.post('/register', checkNotAuthenticated, async (req, res) => {

       try{
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            users.insertOne({name: req.body.username, email: req.body.email, password: hashedPassword, friends: []}, function(){
                res.redirect('/login')
            })
        }catch(err){
            res.redirect('/register')
        }
        });

    app.get('/users', async (req, res) => {
        
        try {
            users.find({"_id" : ObjectId(req.session.passport.user)}).toArray(function(err, result) {
                if (err) throw err;
                res.json(result[0])

            })
        } catch (error) {}
        });

    app.get("/chats", async (req, res) => {
        try {
            let usr = await users.find({"_id" : ObjectId(req.session.passport.user)}).toArray()
            chats.find({members: usr[0].name}).toArray(function(err, result) {
             if (err) throw err;
             res.json(result)
         });  
        } catch (error) {}
      });

    app.get("/logout", (req, res) => {
        req.logout(req.user, err => {
          if(err) return next(err);
          
          res.redirect("/login");
        });
    });

      
    //Authentication check functions
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
            try{
                console.log('Connected to Socket.io, socket id: ' + socket.id);

                messages.find({}).toArray(function(err, result) {
                    if (err) throw err;
                }); 

            }catch(err){}  
            
        //Get chat list
        socket.on('receiveChats', async (chat) => {
            let user = await getUser(socket.id)
            chats.find( { members :{ $elemMatch :{name : user} }}).toArray(function(err, result) {
                    if (err) throw err;
            io.emit('receiveChats', [chat])
            });
        });


        //Set socket id to user
        socket.on('loggedIn', async (user, sid) => {
            try {
                users.updateOne({"name" : user.name }, {$set: {socketId: sid}})
            } catch (error) {}
            
            });

        //Join Chat
        socket.on('joinRoom', async function(room){
            var rooms = await Array.from(socket.rooms);
            socket.leave(rooms[1])
            socket.join(room)

            messages.find({roomName: room}).toArray(function(err, result) {
                if (err) throw err;
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


        //Add friend
        socket.on('addFriend', async (user, friend) => {

            //Does the friend exist?
            users.findOne({name: friend}, function(err, result) {
                if (err) throw err;
                    if(result){
                        //Does the user already have the friend?
                        users.findOne({name: user, friends: friend}, function(err, result) {
                            if (err) throw err;
                                if(result){
                                    io.to(socket.id).emit('friendAdded', friend + " is already a friend")
                                }else{
                                    users.updateOne({"name" : user}, {$push: {friends: friend}})
                                    io.to(socket.id).emit('friendAdded', friend + " added as a friend")
                                }
                        });
                    }else{
                        io.to(socket.id).emit('friendAdded', friend +  " does not exist")
                    }
            });
        });

        //Add chat
        socket.on('addChat', async (chat) => {

            //Does the chat already exist?
            chats.findOne({name: chat.name}, function(err, result) {
                if (err) throw err;
                    if(result){
                        io.to(socket.id).emit('chatAdded', "Chatroom name already exists")
                    }else{
                        chats.insertOne({owner: chat.user.name, name: chat.name, members: chat.members})
                        users.find({name: { $in: chat.members}}).toArray(function(err, result) {
                            if (err) throw err;
                            result.forEach(element => {
                                io.to(element.socketId).emit('receiveChats', [chat])
                            });
                        });
                    }
            });
        });


        //Send Message
        socket.on('sendMessage', async (msg, req) => {

            var room = await Array.from(socket.rooms);
            try{
                messages.insertOne({sender: msg.sender, roomName: room[1], message: msg.message, date: msg.date, time: msg.time}, function(){
                    io.to(room[1]).emit('receiveMessage', [msg])
                })            
                }
            catch(err){}
        });

        //Get User by socket id
        async function getUser(sid){
            try {
                users.findOne({socketId: sid}, function(err, result) {
                    if (err) throw err;
                    return result
                })
            } catch (error) {}
        }

    });


    //Get user by email
    async function getUserByEmail(email){
        try {
            let result = await users.find({email: email}).toArray();
            return result[0];
        } catch (error) {}

      }

    //Get user by id
    async function getUserById(id){

       try {
            users.find({"_id" : ObjectId(id)}).toArray(async function(err, result) {
                if (err) throw err;
                return result[0]
            })
       } 
       catch (error) {}
    }

          
    server.listen(3001, () => {
        console.log('Server is running on port 3001');
      });
      
});

