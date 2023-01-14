// if (process.env.NODE_ENV !== 'production') {
//     require('dotenv').config()
// }

// //DB connection modules
// const mongodb = require('mongodb').MongoClient;
// const express = require('express');
// const app = express();
// const server = require("http").createServer(app);
// const bodyParser = require('body-parser');
// const mongoStore = require('connect-mongo');
// //const router = express.Router();

// //Login handler modules
// const LocalStrategy = require('passport-local').Strategy
// //const User = require('./models/Users');
// //const auth = require('./routes/auth.js');
// const flash = require('express-flash');
// const session = require('express-session');
// const passport = require('passport');
// const sessionStore = new session.MemoryStore();
// const sharedsession = require("express-socket.io-session");
// const passportSocketIo = require('passport.socketio');
// const cookieParser = require('cookie-parser');
// const bcrypt = require('bcrypt');
// //const initializePassport  = require('./passportConfig');


// var sessionMiddleware = session({
//     secret: 'some secret',
//     key: 'express.sid',
//     resave: true,
//     httpOnly: true,
//     secure: false,
//     ephemeral: true,
//     saveUninitialized: true,
//     cookie: {},
//     store:new mongoStore({
//     mongooseConnection: mongoose.connection,
//     db: 'mydb'
//     })
//   });

// //Socket


// const io = require('socket.io')(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"],
//         transports: ['websocket', 'polling'],
//         credentials: true
//     },
// });

// app.set("view engine", "ejs");
// app.use(express.urlencoded({extended: false}));
// app.use(flash())
// app.use(session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//     key: 'express.sid',
//     store: sessionStore
// }));

// // io.use(passportSocketIo.authorize({
// //     store: sessionStore,
// //     key: 'express.sid',
// //     passport: passport,
// //     cookieParser: cookieParser,
// //     secret: "secret"
// // }));

// // io.use(sharedsession(session, {
// //     autoSave:true,
// //     secret: process.env.SESSION_SECRET,
// //     saveUninitialized: true,
// //     resave: false,

// // }));

// app.use(bodyParser.json());
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(express.static(__dirname + '/public'));
// app.use(express.static(__dirname + '/views'));

// //Connect to MongoDB
// mongodb.connect('mongodb://localhost:27017', (err, db) => {


//     if (err){ throw err;}

//     let dbo = db.db('collective')
//     let chats = dbo.collection('chats');
//     let users = dbo.collection('users');

//     function initialize(passport) {
//         const authenticateUser = async (email, password, done) => {
//           const user = await getUserByEmail(email)
          
//           if (user == null) {
//             return done(null, false, { message: 'Account not found' })
//           }
//           console.log(user.password)
//           try {
//               console.log(password, user.password)
//             if (await bcrypt.compare(password, user.password)) {
//               return done(null, user)
//             } else {
//               return done(null, false, { message: 'Password incorrect' })
//             }
//           } catch (e) {
//             return done(e)
//           }
//         }

//         passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
//         passport.serializeUser((user, done) => done(null, user._id))
//         passport.deserializeUser((_id, done) => {
//           return done(null, getUserById(_id))
//         })
//       }
  
//     console.log('Connected to MongoDB');

//     initialize(
//         passport,
//         email => users.findOne({email: email}),
//         id => users.findOne({id: id})
//       )

    

//     app.get('/', checkAuthenticated,  (req, res) => {
//         res.render("index", {name: req.body.username})
        
//         });

//     app.get('/login', checkNotAuthenticated, (req, res) => {
//         let session1 = req.session;
//         if(session1){
//             console.log(session1)
//         }
//         else{
//             console.log("No session")
//         }
//         res.render("login", {message: 'Please enter your email and password'})
//         });



//     app.post('/login',
//      checkNotAuthenticated,
//       passport.authenticate('local', {failureRedirect: '/login', failureFlash: true}),
//       function(req, res) {
//         console.log(req.session)
//         //session.user.email = req.body.email;
//         res.render("index", {name: req.user.name})
//         saveUser(req)
        
//         // let user = JSON.stringify(req.user)
//         // localStorage.setItem("currentUser", user);
              
//     });


//     app.get('/register', checkNotAuthenticated, (req, res) => {
//     res.render("register.ejs")
//     });

//     app.post('/register', checkNotAuthenticated, async (req, res) => {
//        try{
//             const hashedPassword = await bcrypt.hash(req.body.password, 10)
//             console.log( hashedPassword)
//             users.insertOne({name: req.body.username, email: req.body.email, password: hashedPassword}, function(){
//                 res.redirect('/login')
//             })

//         }catch(err){
//             res.redirect('/register')
//             console.log(err);
//         }
//     });

//     app.get("/logout", (req, res) => {
//         req.logout(req.user, err => {
//           if(err) return next(err);
          
//           res.redirect("/login");
//         });
//       });
      
//       function checkAuthenticated(req, res, next) {
//         if (req.isAuthenticated()) {
//           return next()
//         }
      
//         res.redirect('/login')
//       }
      
//       function checkNotAuthenticated(req, res, next) {
//         if (req.isAuthenticated()) {
//           return res.redirect('/')
//         }
//         next()
//       }


//     //Socket.io connection

//     io.on('connection', (socket) => {
//         console.log(session.userName)
//         let messages = dbo.collection('messages');
//             try{
//                 console.log('Connected to Socket.io, socket id: ' + socket.id);

//                 messages.find({}).toArray(function(err, result) {
//                     if (err) throw err;
                    
//                 socket.emit('receiveMessage', result)
//             });
//             }catch(err){
//                 console.log(err);
//             }  

//     //Get chat list


//     //Receive messages
//     socket.on('receiveMessage', (msg) => {
        
//         messages.find({}).toArray(function(err, result) {
//             if (err) throw err;            
//         io.emit('receiveMessage', result)
//         });
//     });


//         //Send Messages
//         socket.on('sendMessage', (msg, req) => {
            
//             let sender = msg.sender;
//             let chat_id = msg.chat_id;
//             let message = msg.message;
//             let date = msg.date;
//             let time = msg.time;
//             console.log(msg._id)
//             try{
//                 messages.insertOne({sender: sender, chat_id: chat_id, message: message, date: date, time: time}, function(){
//                     io.emit('receiveMessage', [msg])
//                 })            
//              }
//             catch(err){
//                 console.log(err);
//             }
//     });      
        

//         //Status function
//         showStatus = function(s) {
//             socket.emit('status', s);
//         }
//     });

//     async function getUserByEmail(email){
//         try {
//             let result = await users.find({email: email}).toArray();
//             //console.log(result[0].name)
//             //let query = users.find({email : email})
//             return result[0];
//         } catch (error) {
//             console.log(error);
//         }

//       }

//       async function getUserById(id){
//         let result = await users.find({_id: id}).toArray();
//         //console.log(result[0])
//         //let query = users.find({email : email})
//         return result[0];
//       }
//       function saveUser(req){
//         // passport.user = req.user;
//         // let session = req.session;
//         // console.log
//       }
      
//     server.listen(3001, () => {
//         console.log('Server is running on port 3001');
//       });
      
// });

// module.exports = app;

