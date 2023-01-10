const express = require('express');
const router = express.Router();
const users = require('../models/user.js');


//Get all users
router.get('/users', async (req, res) => {
    try {
        const user = await users.find();
        res.json(user);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

//Get one user
router.get('/users/:id', getUser, (req, res) => {
res.send(res.user)
});

//Create one user
router.post('/users', async (req, res) => {
    const user = new users({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })
    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
});

//Update one user
router.patch('/users/:id', getUser, async (req, res) => {
    if(req.body.username != null) {
        res.user.username = req.body.username;
    }
    if(req.body.email != null) {
        res.user.email = req.body.email;
    }
    if(req.body.password != null) {
        res.user.password = req.body.password;
    }
    try {
        const updatedUser = res.user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({message: err.message});
    }  
});

//Delete one user
router.delete('/users/:id', getUser, async (req, res) => {
    try{
    await res.user.remove();
    res.json({message: 'User deleted'});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

//Middleware

async function getUser(req, res, next) {
    let user;
    try {
        user = await users.findById(req.params.id);
        if (user == null) {
            return res.status(404).json({message: 'Cannot find user'});
        }
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
    res.user = user;
    next();
}

module.exports = router