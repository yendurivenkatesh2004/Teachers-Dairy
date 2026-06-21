const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Section name is required (e.g., A, B, C)'],
        trim: true
    },
    className: {
        type: String,
        required: [true, 'Class name is required (e.g., Class 10)'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate sections for the same class
SectionSchema.index({ name: 1, className: 1 }, { unique: true });

module.exports = mongoose.model('Section', SectionSchema);
