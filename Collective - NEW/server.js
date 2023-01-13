if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//DB connection modules
const mongodb = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const server = require("http").createServer(app);
//const router = express.Router();

//Login handler modules
const LocalStrategy = require('passport-local').Strategy
const User = require('./models/Users');
const auth = require('./routes/auth.js');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');
const initializePassport  = require('./passportConfig');




//Socket

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    // allowEIO3: true
});

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
//app.use("/api/auth", auth);




//Connect to MongoDB
mongodb.connect('mongodb://localhost:27017', (err, db) => {
    if (err){ throw err;}

    let dbo = db.db('collective')
    let chats = dbo.collection('chats');
    let users = dbo.collection('users');
    //let user2 = getUserByEmail('sam@ttt.com')
    //console.log(user2.username)
    // let users2 = users.find({}).toArray(function(err, result) {
    //     if (err) throw err;
    //     console.log(result);
    // })

    function initialize(passport) {
        const authenticateUser = async (email, password, done) => {
          const user = await getUserByEmail(email)
          //console.log(user)
          //console.log(email)
          
          if (user == null) {
            return done(null, false, { message: 'No user with that email' })
          }
          console.log(user.password)
          try {
              console.log(password, user.password)
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
        // passport.serializeUser(function(user, done) {
        //     done(null, user);
        //   });
          
        //   passport.deserializeUser(function(user, done) {
        //     done(null, user);
        //   });
        passport.serializeUser((user, done) => done(null, user._id))
        passport.deserializeUser((_id, done) => {
          return done(null, getUserById(_id))
        })
      }
  
    console.log('Connected to MongoDB');

    initialize(
        passport,
        email => users.findOne({email: email}), //(user => user.email === email),
        id => users.findOneAndDelete({id: id}) //(user => user.id === id
      )
      //console.log(initializePassport)


    app.get('/', (req, res) => {
        res.render("index", {name: 'Sam'})
        });

    app.get('/login', (req, res) => {
        res.render("login", {message: 'Please enter your email and password'})
        });



    app.post('/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }));


    app.get('/register', (req, res) => {
    res.render("register.ejs")
    });

    app.post('/register', async (req, res) => {
       try{
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            console.log( hashedPassword)
            users.insertOne({name: req.body.username, email: req.body.email, password: hashedPassword}, function(){
                res.redirect('/login')
            })

        }catch(err){
            res.redirect('/register')
            console.log(err);
        }
    });

    app.delete('/logout', (req, res) => {
        req.logOut()
        res.redirect('/login')
      })
      
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


    //Socket.io connection
    io.on('connection', (socket) => {
        let messages = dbo.collection('messages');
            try{
                console.log('Connected to Socket.io, socket id: ' + socket.id);

                messages.find({}).toArray(function(err, result) {
                    if (err) throw err;
                    
                socket.emit('receiveMessage', result)
            });
            }catch(err){
                console.log(err);
            }  


    //Register


    //Login



    //Get chat list


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

      async function getUserById(id){
        let result = await users.find({_id: id}).toArray();
        //console.log(result[0])
        //let query = users.find({email : email})
        return result[0];
      }

      
    server.listen(3001, () => {
        console.log('Server is running on port 3001');
      });
      
});

module.exports = app;

