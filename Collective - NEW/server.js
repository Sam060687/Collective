if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//DB connection modules
const mongodb = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const server = require("http").createServer(app);
const bodyParser = require('body-parser');
var sessionstore = require('sessionstore');
var ObjectId = require('mongodb').ObjectId;
// const MongoDbStore = require('connect-mongo');

// const mongoose = require('mongoose');
//const router = express.Router();

//Login handler modules
const LocalStrategy = require('passport-local').Strategy
//const User = require('./models/Users');
//const auth = require('./routes/auth.js');
const flash = require('express-flash');
let session = require('express-session');
const passport = require('passport');
// const sharedsession = require("express-socket.io-session");
// const passportSocketIo = require('passport.socketio');
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
//const initializePassport  = require('./passportConfig');

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



// io.use(sharedsession(session, {
//     autoSave:true,
//     secret: process.env.SESSION_SECRET,
//     saveUninitialized: true,
//     resave: false,

// }));

app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

//Connect to MongoDB
mongodb.connect('mongodb://localhost:27017', (err, db) => {


    if (err){ throw err;}

    let dbo = db.db('collective')
    let chats = dbo.collection('chats');
    let users = dbo.collection('users');
    let sessions = dbo.collection('sessions');

    function initialize(passport) {
        const authenticateUser = async (email, password, done) => {
          const user = await getUserByEmail(email)
          
          if (user == null) {
            return done(null, false, { message: 'Account not found' })
          }
          //console.log(user.password)
          try {
              //console.log(password, user.password)
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
  
    console.log('Connected to MongoDB');

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
        // let session1 = req.session;
        // if(session1){
        //     
        // }
        // else{
           
            console.log("No session", socket.id)
        // }
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

    app.post('/message', checkNotAuthenticated,  (req, res) => {
        try{
             messages.insertOne({message: req.body.message, sender: req.body.user, time: req.body.time})
             //console.log( req)
        }catch(err){
            console.log(err);
        }
    });
    app.get('/users', async (req, res) => {
        //let id = 
        try {
            users.find({"_id" : ObjectId(req.session.passport.user)}).toArray(function(err, result) {
                if (err) throw err;
                res.json(result[0])

            })
        } catch (error) {
            
        }

    })
    
    // app.get('/friends', checkNotAuthenticated,  (req, res) => {
    //     console.log("Friends")
    //     // try {
    //         users.find({"_id" : ObjectId(req.session.passport.user)},{friends}).toArray(function(err, result) {
    //             if (err) throw err;
    //             res.json(result)
    //         })
            
    //      //} catch (error) {
            
    //     // }



    //     // }catch(err){
    //         // console.log(err);
    //     // }
    // });



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


      function getUsername(id){
        //var id2 = new ObjectId(id)
       //console.log(id)
            users.find(ObjectId(id)).toArray(function(err, result) {
                if (err) throw err;
                
                //console.log(result[0])
            return result[0]
            });
        }
        
      


    //Socket.io connection

    io.on('connection', async function (socket) {

        let chats = dbo.collection('chats');
        let messages = dbo.collection('messages');
        //let user = await getUser()
            try{
                console.log('Connected to Socket.io, socket id: ' + socket.id);

                messages.find({}).toArray(function(err, result) {
                    if (err) throw err;
                
                    //users.updateOne({"name" : user }, {$set: {socketId: socket.id}})
                    
                //socket.emit('receiveMessage', result)
                });

                // chats.find({members: "sam"}).toArray(function(err, result) {
                //     if (err) throw err;
                    
                //io.to(socket.id).emit('receiveChats', result)
                // });
            }catch(err){
                console.log(err);
            }  
            
            //Get chat list
            socket.on('receiveChats', (chat) => {
                
                // chats.find( { },{ members :{ $elemMatch :{name : userId} }}).toArray(function(err, result) {
                //     if (err) throw err;
                io.emit('receiveChats', [chat])
                // });
            });

    //Receive messages
    socket.on('receiveMessage', (msg) => {
        
        messages.find({}).toArray(function(err, result) {
            if (err) throw err;            
        io.emit('receiveMessage', result)
        });
    });


    socket.on('addFriend', async (user, friend) => {

         users.updateOne({"name" : user}, {$push: {friends: friend}})
        });

    socket.on('addChat', async (chat) => {
        chats.insertOne({owner: chat.user.name, name: chat.chatName, members: chat.members}, function(){
            io.emit('receiveChats', [chat])
        })            
    });



        //Send Messages
        socket.on('sendMessage', (msg, req) => {
            
            let sender = msg.sender;
            let chat_id = msg.chat_id;
            let message = msg.message;
            let date = msg.date;
            let time = msg.time;
            try{
                messages.insertOne({sender: sender, chat_id: chat_id, message: message, date: date, time: time}, function(){
                    io.emit('receiveMessage', [msg])
                })            
             }
            catch(err){
                console.log(err);
            }
    });      
        

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
    //   async function getUser(req){

    //     let user = ''

    //     try {
    //         // await app.get("/users", function(req, res){
    //         //      user = req;
    //         //   });
    //         //   console.log(user)
    //         user = req.session.passport.user
    //           return user;
              
    //     } catch (error) { 
    //         console.log(error);
    //     }}

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

