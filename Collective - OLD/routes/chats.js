const express = require('express');
const router = express.Router();
const messages = require('../models/chat.js');


//Get all messages
router.get('/messages', async (req, res) => {
    try {
        const message = await messages.find();
        res.json(message);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

//Get one message
router.get('/messages/:id', getMessage, (req, res) => {
res.send(res.message)
});

//Create one user
router.post('/messages', async (req, res) => {
    const message = new messages({
        // username: req.body.username,
        // email: req.body.email,
        // password: req.body.password
    })
    try {
        const newMessage = await message.save();
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
});

//Update one message
router.patch('/messages/:id', getMessage, async (req, res) => {
    // if(req.body.username != null) {
    //     res.user.username = req.body.username;
    // }
    // if(req.body.email != null) {
    //     res.user.email = req.body.email;
    // }
    // if(req.body.password != null) {
    //     res.message.password = req.body.password;
    // }
    try {
        const updatedMessage = res.message.save();
        res.json(updatedMessage);
    } catch (err) {
        res.status(400).json({message: err.message});
    }  
});

//Delete one message
router.delete('/messages/:id', getMessage, async (req, res) => {
    try{
    await res.message.remove();
    res.json({message: 'message deleted'});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

//Middleware

async function getMessage(req, res, next) {
    let message;
    try {
        message = await messages.findById(req.params.id);
        if (message == null) {
            return res.status(404).json({message: 'Cannot find message'});
        }
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
    res.message = message;
    next();
}

module.exports = router