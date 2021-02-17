const mongoose = require('mongoose');
const validator = require('validator')

// const adminSchema = new mongoose.Schema({
const Course = mongoose.model('Course', {
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    teacherName: {
        type: String,
        required: true,
        trim: true
    }
  
});

// const Admin = mongoose.model('Admin', adminSchema);

module.exports = Course;