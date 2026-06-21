const mongoose = require('mongoose');

const HODProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    subjects: [{
        subject: {
            type: String,
            required: true,
            trim: true
        },
        classNames: [{
            type: String,
            trim: true
        }]
    }]
}, { timestamps: true });

module.exports = mongoose.model('HODProfile', HODProfileSchema);
