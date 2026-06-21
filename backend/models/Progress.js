const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    allocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Allocation',
        required: true
    },
    // References the subtopic's own _id (subdocument id inside Allocation.topics[].subtopics[]),
    // not its title. Titles are not guaranteed unique, so they're unsafe as an identifier.
    subtopicId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // Denormalized for convenience (e.g. display without populating/walking the allocation tree).
    // Not used for identity — never matched against to find/update a progress record.
    topicTitle: {
        type: String,
        required: true
    },
    subtopicTitle: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['not_yet', 'in_progress', 'completed'],
        default: 'not_yet'
    }
}, { timestamps: true });

ProgressSchema.index({ allocation: 1, subtopicId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
