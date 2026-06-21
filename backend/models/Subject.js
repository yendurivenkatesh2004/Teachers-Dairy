const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    className: {
        type: String,
        required: [true, 'Class name is required'],
        trim: true
    }
}, { timestamps: true });

SubjectSchema.index({ name: 1, className: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);