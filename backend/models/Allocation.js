const mongoose = require('mongoose');

const SubtopicSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' }
}); // _id defaults to true — each subtopic gets its own stable ObjectId

const TopicSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    subtopics: [SubtopicSchema],
    description: { type: String, trim: true, default: '' }
}); // _id defaults to true — each topic gets its own stable ObjectId

const AllocationSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    topics: [TopicSchema]
}, { timestamps: true });

AllocationSchema.index({ teacher: 1, className: 1, section: 1, subject: 1 }, { unique: true });
AllocationSchema.index({ className: 1, section: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Allocation', AllocationSchema);
