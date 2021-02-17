const mongoose = require('mongoose');
const validator = require('validator')

// const adminSchema = new mongoose.Schema({
const Admin = mongoose.model('Admin', {
    name: {
        type: String,
        required: true,
        trim: true
    },email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email id....!');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if (value.toLowerCase().includes('password')) {
                throw new Error('password cannot contain "password"');
            }
        }
    }
});

// const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;