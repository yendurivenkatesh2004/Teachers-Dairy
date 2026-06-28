const Allocation = require('../models/Allocation');
const Progress = require('../models/Progress');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

// @desc    Teacher creates syllabuses for multiple sections at once
// @route   POST /api/syllabus/create
// @body    { className, subject, sections: [{ sectionId, topics: [] }] }
exports.createSyllabus = async (req, res) => {
    try {
        const { className, subject, sections, startDate, endDate } = req.body;

        if (!className || !subject || !sections || sections.length === 0) {
            return res.status(400).json({ message: 'className, subject and at least one section are required' });
        }

        const results = [];
        const errors = [];

        for (const sectionEntry of sections) {
            const { sectionId, topics } = sectionEntry;

            if (!sectionId || !topics || topics.length === 0) {
                errors.push({ sectionId, reason: 'Missing sectionId or topics' });
                continue;
            }

            const sectionDoc = await Section.findById(sectionId);
            if (!sectionDoc) {
                errors.push({ sectionId, reason: 'Section not found' });
                continue;
            }
            if (sectionDoc.className !== className) {
                errors.push({ sectionId, reason: 'Section does not belong to the specified class' });
                continue;
            }

            try {
                const allocation = await Allocation.create({
                    teacher: req.user._id,
                    className,
                    section: sectionDoc.name,
                    subject,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    topics
                    // Note: each topic/subtopic subdocument automatically gets its own
                    // _id here from Mongoose — that id is what Progress will reference.
                });

                results.push({ section: sectionDoc.name, allocation });
            } catch (innerError) {
                if (innerError.code === 11000) {
                    errors.push({ sectionId, reason: `A syllabus for ${subject} in Section ${sectionDoc.name} already exists` });
                } else {
                    errors.push({ sectionId, reason: innerError.message });
                }
            }
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'No syllabuses were created', errors });
        }

        res.status(201).json({ message: `${results.length} syllabus(es) created successfully`, results, errors });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Teacher deletes their own syllabus and allocation
// @route   DELETE /api/syllabus/:syllabusId
exports.deleteSyllabus = async (req, res) => {
    try {
        const { syllabusId } = req.params;  // syllabusId is now allocationId

        const allocation = await Allocation.findOne({ _id: syllabusId, teacher: req.user._id });
        if (!allocation) return res.status(404).json({ message: 'Allocation not found or not authorized' });

        await Progress.deleteMany({ allocation: allocation._id });
        await Allocation.findByIdAndDelete(allocation._id);

        res.status(200).json({ message: 'Syllabus deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all allocations for a teacher with live progress
// @route   GET /api/syllabus/teacher/:teacherId
exports.getTeacherAllocations = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const allocations = await Allocation.find({ teacher: teacherId });

        const enhanced = await Promise.all(allocations.map(async (alloc) => {
            // subtopicId is now the reliable key the frontend should match against.
            // topicTitle/subtopicTitle are kept too, only for convenience/display.
            const progressRecords = await Progress.find({ allocation: alloc._id })
                .select('subtopicId topicTitle subtopicTitle status updatedAt');
            return { ...alloc._doc, completedTopics: progressRecords };
        }));

        res.status(200).json(enhanced);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update subtopic status
// @route   PATCH /api/syllabus/update-topic
// @body    { allocationId, subtopicId, status }
exports.updateTopicStatus = async (req, res) => {
    try {
        const { allocationId, subtopicId, status } = req.body;

        if (!allocationId || !subtopicId || !status) {
            return res.status(400).json({ message: 'allocationId, subtopicId and status are required' });
        }
        if (!['not_yet', 'in_progress', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const allocation = await Allocation.findById(allocationId);
        if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

        // Find the actual topic/subtopic inside the allocation by id, rather than
        // trusting a title sent from the client. This is also how we validate
        // that subtopicId genuinely belongs to this allocation, and lets us pull
        // the current titles to store on the Progress record for display.
        let matchedTopic = null;
        let matchedSubtopic = null;

        for (const topic of allocation.topics) {
            const found = topic.subtopics.find(s => s._id.toString() === subtopicId);
            if (found) {
                matchedTopic = topic;
                matchedSubtopic = found;
                break;
            }
        }

        if (!matchedSubtopic) {
            // TEMPORARY DEBUG LOGGING — remove once the mismatch is found.
            console.log('--- Subtopic not found debug ---');
            console.log('Received subtopicId from request body:', subtopicId, '| typeof:', typeof subtopicId);
            console.log('AllocationId:', allocationId);
            console.log('Subtopic ids actually stored in this allocation:');
            for (const topic of allocation.topics) {
                for (const sub of topic.subtopics) {
                    console.log(`  topic="${topic.title}" subtopic="${sub.title}" _id=${sub._id} | typeof _id=${typeof sub._id} | sub._id present? ${!!sub._id}`);
                }
            }
            console.log('--- end debug ---');

            return res.status(404).json({ message: 'Subtopic not found in this allocation' });
        }

        if (status === 'not_yet') {
            await Progress.deleteOne({ allocation: allocationId, subtopicId });
        } else {
            await Progress.findOneAndUpdate(
                { allocation: allocationId, subtopicId },
                {
                    $set: {
                        status,
                        topicTitle: matchedTopic.title,
                        subtopicTitle: matchedSubtopic.title
                    }
                },
                { upsert: true, returnDocument: 'after' }
            );
        }

        res.status(200).json({ message: 'Subtopic status updated successfully' });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Duplicate entry error' });
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all sections
// @route   GET /api/syllabus/sections
exports.getSections = async (req, res) => {
    try {
        const sections = await Section.find().sort({ className: 1, name: 1 });
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get subjects for a class
// @route   GET /api/syllabus/subjects?className=X
exports.getSubjectsByClass = async (req, res) => {
    try {
        const { className } = req.query;
        if (!className) return res.status(400).json({ message: 'className is required' });
        const subjects = await Subject.find({ className }).sort({ name: 1 });
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Teacher updates comment on their allocation
// @route   PATCH /api/syllabus/:syllabusId/comment
// @body    { comment }
exports.updateAllocationComment = async (req, res) => {
  try {
    const { syllabusId } = req.params;
    const { comment } = req.body;

    const allocation = await Allocation.findOneAndUpdate(
      { _id: syllabusId, teacher: req.user._id },
      { $set: { comment: comment?.trim() || 'No comment' } },
      { new: true }
    );

    if (!allocation) return res.status(404).json({ message: 'Allocation not found or not authorized' });
    res.status(200).json({ message: 'Comment updated', comment: allocation.comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
