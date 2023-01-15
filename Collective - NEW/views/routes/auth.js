// const express = require('express');
// const router = express.Router();
// const passport = require('passport');

// router.post('/login', (req, res, next) => {
//     passport.authenticate('local', function(err, user, info) {
//         if (err) {
//              return res.status(400).json({message: 'Error'}); 
//             }
//         if (!user) {
//             res.redirect('/login')
//             return res.status(400).json({message: 'No user found'}); 
//         }
//         req.logIn(user, function(err) {
//             if (err) { 
//                 return res.status(400).json({message: 'Error'}); 
//             }
//             res.render('index', {name: 'Sam'})
//             return res.status(200).json({message: 'Login successful'}); 
//         });
//         })(req, res, next);

//         });

// module.exports = router;