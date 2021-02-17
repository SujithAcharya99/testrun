const mongoose = require('mongoose');
const validator = require('validator');

const roomSchema = new mongoose.Schema({
    mainUser: {
        type: String,
        required: true,
    },
    type:{
        type:Number,
        required: true
    },
    userNames: [{
        type: String,
        required: true,
    }],
    userIds: [{
        type: String,
        required: true,
    }],
    message: [{
        username: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Number,
            required: true
        }

    }]
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
