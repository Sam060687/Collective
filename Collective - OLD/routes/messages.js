const express = require('express');
const router = express.Router();
const messages = require('../models/message.js');


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

//Create message
router.post('/messages', async (req, res) => {
    const message = new messages({
        chat_id: req.body.chat_id,
        message: req.body.message,
        date: req.body.date,
        time: req.body.time,
        image: req.body.image,
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
    if(req.body.chat_id != null) {
        res.message.chat_id = req.body.chat_id;
    }
    if(req.body.message != null) {
        res.message.message = req.body.message;
    }
    if(req.body.date != null) {
        res.message.date = req.body.date;
    }
    if(req.body.time != null) {
        res.message.time = req.body.time;
    }
    if(req.body.image != null) {
        res.message.image = req.body.image;
    }
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