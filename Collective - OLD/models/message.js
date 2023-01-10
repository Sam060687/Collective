const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chat_id: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('messages', messageSchema);