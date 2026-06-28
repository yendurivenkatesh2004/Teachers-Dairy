const HODProfile = require('../models/HODProfile');
const Allocation = require('../models/Allocation');
const Progress = require('../models/Progress');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

// @desc    HOD sets up their profile — list of { subject, classNames } entries
// @route   POST /api/hod/setup
exports.setupProfile = async (req, res) => {
    try {
        const { subjects } = req.body;

        if (!Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ message: 'Please add at least one subject with classes.' });
        }

        const seenSubjects = new Set();
        for (const entry of subjects) {
            if (!entry || typeof entry.subject !== 'string' || !entry.subject.trim()) {
                return res.status(400).json({ message: 'Each entry must have a subject.' });
            }
            if (!Array.isArray(entry.classNames) || entry.classNames.length === 0) {
                return res.status(400).json({ message: `Please select at least one class for ${entry.subject}.` });
            }
            if (seenSubjects.has(entry.subject)) {
                return res.status(400).json({ message: `"${entry.subject}" was added more than once.` });
            }
            seenSubjects.add(entry.subject);
        }

        const profile = await HODProfile.findOneAndUpdate(
            { user: req.user._id },
            { subjects },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'HOD profile saved successfully', profile });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get HOD's own profile
// @route   GET /api/hod/profile
exports.getProfile = async (req, res) => {
    try {
        const profile = await HODProfile.findOne({ user: req.user._id });
        res.status(200).json(profile || null);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all classes in the system (for HOD setup screen)
// @route   GET /api/hod/classes
exports.getAvailableClasses = async (req, res) => {
    try {
        const sections = await Section.find().sort({ className: 1 });
        const uniqueClasses = [...new Set(sections.map(s => s.className))];
        res.status(200).json(uniqueClasses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all subjects in the system (for HOD setup screen)
// @route   GET /api/hod/subjects
exports.getAvailableSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    HOD's read-only progress view — per-subject class scoping (no cross product)
// @route   GET /api/hod/progress
exports.getProgress = async (req, res) => {
    try {
        const profile = await HODProfile.findOne({ user: req.user._id });
        if (!profile || !profile.subjects || profile.subjects.length === 0) {
            return res.status(200).json([]);
        }

        // Build one condition per subject, scoped to that subject's own classes —
        // this replaces the old subjects-IN-x AND classNames-IN-y cross join.
        const orConditions = profile.subjects
            .filter(entry => entry.classNames && entry.classNames.length > 0)
            .map(entry => ({ subject: entry.subject, className: { $in: entry.classNames } }));

        if (orConditions.length === 0) return res.status(200).json([]);

        const relevant = await Allocation.find({ $or: orConditions }).populate('teacher', 'name mobileNo');

        // Single batch query — no N+1
        const allocIds = relevant.map(a => a._id);
        const allProgress = await Progress.find({ allocation: { $in: allocIds } });

        const progressByAlloc = {};
        for (const p of allProgress) {
            const key = p.allocation.toString();
            if (!progressByAlloc[key]) progressByAlloc[key] = [];
            progressByAlloc[key].push(p);
        }

        // Group by className, then by subject within each class
        const byClassSubject = {};
        for (const alloc of relevant) {
            const classKey = alloc.className;
            const subjectKey = alloc.subject;
            if (!byClassSubject[classKey]) byClassSubject[classKey] = {};
            if (!byClassSubject[classKey][subjectKey]) byClassSubject[classKey][subjectKey] = [];
            byClassSubject[classKey][subjectKey].push(alloc);
        }

        const result = [];
        for (const className in byClassSubject) {
            const subjectEntries = [];
            for (const subject in byClassSubject[className]) {
                const details = [];
                for (const alloc of byClassSubject[className][subject]) {
                    const progressRecords = progressByAlloc[alloc._id.toString()] || [];
                    const totalSubtopics = (alloc.topics || []).reduce((sum, t) => sum + (t.subtopics?.length || 0), 0);
                    const completedRecords = progressRecords.filter(p => p.status === 'completed');

                    details.push({
                        teacher: alloc.teacher,
                        subject: alloc.subject,
                        section: alloc.section,
                        startDate: alloc.startDate,
                        endDate: alloc.endDate,
                        comment: alloc.comment || 'No comment',
                        topics: alloc.topics,
                        totalTopics: totalSubtopics,
                        completedTopics: completedRecords.length,
                        progress: totalSubtopics > 0
                            ? Math.round((completedRecords.length / totalSubtopics) * 100)
                            : 0,
                        completedSubtopicIds: completedRecords.map(p => p.subtopicId.toString())
                    });
                }
                subjectEntries.push({ subject, details });
            }
            result.push({ className, subjects: subjectEntries });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('HOD getProgress error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
