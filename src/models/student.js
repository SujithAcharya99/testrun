const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');

// const studentSchema = new mongoose.Schema({
// const Student = mongoose.model('Student',{
const studentSchema = new mongoose.Schema({
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
    },password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if (value.toLowerCase().includes('password')) {
                throw new Error('password cannot contain "password"');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be greater than zero');
            }
        }
    },
    roll:{
        type: String,
        default: 'not assigned'
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

// const Student = mongoose.model('Student', adminSchema);

studentSchema.methods.generateAuToken = async function () {
    const student = this;
    // console.log('inside token')
    // console.log(student)
    // const token = jwt.sign({ _id: user._id.toString() }, 'thisismynewcourse')
    const token = jwt.sign({ _id: student._id.toString() }, 'thisismynewcourse')
    // console.log(token)
    student.tokens = student.tokens.concat({ token });
    await student.save();

    return token;
}

studentSchema.statics.findByCredentials = async (email, password) => {
    const student = await Student.findOne({ email });
    // console.log(student)
    // console.log('inside module'
    if (!student) {
        throw new Error('Unable to Login');
    }
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
        throw new Error('Unable is login');
    }
    return student;
};


// hasihing before saving
studentSchema.pre('save',async function (next) {
    const student = this;

    //console.log('just before save');
    if (student.isModified('password')) {
        student.password = await bcrypt.hash(student.password, 8);
    }
    next();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;