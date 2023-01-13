const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
// const pass = "1234"

// function initialize(passport, getUserByEmail, getUserById) {
//   const authenticateUser = async (email, password, done) => {
//     const user = getUserByEmail(email)
//     console.log(user.password)
//     if (user == null) {
//       return done(null, false, { message: 'No user with that email' })
//     }

//     try {
//         console.log(password, user.password)
//       if (await bcrypt.compare(password, user.password)) {
//         return done(null, user)
//       } else {
//         return done(null, false, { message: 'Password incorrect' })
//       }
//     } catch (e) {
//       return done(e)
//     }
//   }

//   passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
//   passport.serializeUser((user, done) => done(null, user.id))
//   passport.deserializeUser((id, done) => {
//     return done(null, getUserById(id))
//   })
// }

// module.exports = initialize

// const LocalStrategy = require('passport-local').Strategy;
// const bcrypt = require('bcrypt');
// const mongodb = require('mongodb').MongoClient;
// // const passport = require('passport');
// // const User = require('./models/Users');

// // passport.serializeUser((user, done) => {
// //     done(null, user.id)
// // })

// // passport.deserializeUser((id, done) => {
// //     User.findById(id, (err, user) => {
// //         done(err, user)
// //     })
// // })

// // passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
// //     try{
// //     User.findOne({ email: email })
// //         .then(user => {
// //             if (!user) {
// //                 return done(null, false, { message: 'No user with that email' })
// //             }
// //             else {
// //                 bcrypt.compare(password, user.password, (err, isMatch) => {
// //                     if (err) throw err;
// //                     if (isMatch) {
// //                         return done(null, user)
// //                     } else {
// //                         return done(null, false, { message: 'Password incorrect' })
// //                     }
// //                 })
// //             }
// //         })
// //     }catch(err){
// //        console.log(err) 
// //     }
// // }))

// // module.exports = passport;


        


// function initialize(passport, email, id) {
//     const authenticateUser = async (email, password, done) => {
//         const user = users.findOne({}).toArray(function(err, result) {
//             if (err) throw err;
//             console.log(result);
//         })
    
//         //console.log(email, password);
//         if (user == null) {
//             console.log('No user with that email')
//             return done(null, false, { message: 'No user with that email' })
//         }

//         try {
//             if (await bcrypt.compare(password, user.password)) {
//                 return done(null, user)
//             } else {
//                 return done(null, false, { message: 'Password incorrect' })
//             }
//         } catch (e) {
//             return done(e)
//         }
    
//     }

//   passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
//     passport.serializeUser((user, done) => {})
//     passport.deserializeUser((id, done) => {})

// }

// module.exports = initialize