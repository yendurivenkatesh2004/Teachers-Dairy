const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    mobileNo: {
        type: String,
        required: [true, 'Please provide a mobile number'],
        unique: true,
        trim: true,
        match: [
            /^[0-9]{10}$/,
            'Please provide a valid 10-digit mobile number'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'principal', 'hm', 'deputy_hm', 'hod'],
        default: 'teacher'
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);
