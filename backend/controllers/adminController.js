const Section = require('../models/Section');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Subject = require('../models/Subject');
const HODProfile = require('../models/HODProfile');

// @desc    Create a new section
// @route   POST /api/admin/sections
exports.createSection = async (req, res) => {
    try {
        const { name, className, description } = req.body;

        if (!name || !className) {
            return res.status(400).json({ message: 'Section name and class name are required' });
        }

        const section = await Section.create({
            name: name.toUpperCase(),
            className,
            description
        });

        res.status(201).json({
            message: 'Section created successfully',
            section
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This section already exists for this class' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a section
// @route   DELETE /api/admin/sections/:sectionId
exports.deleteSection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        const section = await Section.findByIdAndDelete(sectionId);
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        const allocations = await Allocation.find({ section: section.name, className: section.className });
        const allocationIds = allocations.map(a => a._id);
        await Progress.deleteMany({ allocation: { $in: allocationIds } });
        await Allocation.deleteMany({ section: section.name, className: section.className });

        res.status(200).json({ message: 'Section deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all sections
// @route   GET /api/admin/sections
exports.getAllSections = async (req, res) => {
    try {
        const sections = await Section.find().sort({ className: 1, name: 1 });
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all teachers
// @route   GET /api/admin/teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('-password');
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all allocations
// @route   GET /api/admin/allocations
exports.getAllAllocations = async (req, res) => {
    try {
        const allocations = await Allocation.find()
            .populate('teacher', 'name mobileNo')
            .sort({ className: 1, section: 1 });

        res.status(200).json(allocations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all syllabuses (syllabus = Allocation; old standalone Syllabus model is gone)
// @route   GET /api/admin/syllabuses
exports.getAllSyllabuses = async (req, res) => {
    try {
        const syllabuses = await Allocation.find()
            .populate('teacher', 'name mobileNo')
            .sort({ className: 1, subject: 1 });
        res.status(200).json(syllabuses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ role: 1, name: 1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Deregister/delete a user
// @route   DELETE /api/admin/users/:userId
exports.deRegisterUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Any role that can be assigned as a teacher on an Allocation
        // (see syllabusRoutes.js: teacher, hm, deputy_hm, hod can all create syllabuses)
        const teachingRoles = ['teacher', 'hm', 'deputy_hm', 'hod'];
        if (teachingRoles.includes(user.role)) {
            const allocations = await Allocation.find({ teacher: userId });
            for (const alloc of allocations) {
                await Progress.deleteMany({ allocation: alloc._id });
            }
            await Allocation.deleteMany({ teacher: userId });
        }

        // Clean up orphaned HOD profile, if any
        if (user.role === 'hod') {
            await HODProfile.deleteOne({ user: userId });
        }

        res.status(200).json({ message: 'User deregistered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a subject for a class
// @route   POST /api/admin/subjects
exports.createSubject = async (req, res) => {
    try {
        const { name, className } = req.body;
        if (!name || !className) {
            return res.status(400).json({ message: 'Subject name and class name are required' });
        }

        const subject = await Subject.create({ name: name.trim(), className: className.trim() });
        res.status(201).json({ message: 'Subject created successfully', subject });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This subject already exists for this class' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all subjects (optionally filter by className)
// @route   GET /api/admin/subjects
exports.getAllSubjects = async (req, res) => {
    try {
        const filter = req.query.className ? { className: req.query.className } : {};
        const subjects = await Subject.find(filter).sort({ className: 1, name: 1 });
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a subject
// @route   DELETE /api/admin/subjects/:subjectId
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
