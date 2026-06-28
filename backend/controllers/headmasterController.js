const Allocation = require('../models/Allocation');
const Progress = require('../models/Progress');
const User = require('../models/User');

// @desc    Get all classes with their progress
// @route   GET /api/headmaster/classes
exports.getClassesProgress = async (req, res) => {
    try {
        const allocations = await Allocation.find()
            .populate('teacher', 'name mobileNo')
            .sort({ className: 1, section: 1 });

        const classesMap = {};
        for (const alloc of allocations) {
            if (!classesMap[alloc.className]) classesMap[alloc.className] = [];
            classesMap[alloc.className].push(alloc);
        }

        // Batch: single Progress query for all allocations
        const allAllocIds = allocations.map(a => a._id);
        const allProgress = await Progress.find({
            allocation: { $in: allAllocIds },
            status: 'completed'
        }).select('allocation');

        const completedCountByAlloc = {};
        for (const p of allProgress) {
            const key = p.allocation.toString();
            completedCountByAlloc[key] = (completedCountByAlloc[key] || 0) + 1;
        }

        const classesData = [];
        for (const className in classesMap) {
            const allocsInClass = classesMap[className];
            let totalTopics = 0;
            let totalCompleted = 0;

            for (const alloc of allocsInClass) {
                totalTopics += (alloc.topics || []).reduce((sum, t) => sum + (t.subtopics?.length || 0), 0);
                totalCompleted += completedCountByAlloc[alloc._id.toString()] || 0;
            }

            const uniqueSubjects = new Set(allocsInClass.map(a => a.subject).filter(Boolean));
            const uniqueSections = new Set(allocsInClass.map(a => a.section).filter(Boolean));

            classesData.push({
                className,
                totalSubjects: uniqueSubjects.size,
                totalSections: uniqueSections.size,
                totalTopics,
                totalCompleted,
                progress: totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0,
                allocations: allocsInClass
            });
        }

        res.status(200).json(classesData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get detailed progress for a specific class
// @route   GET /api/headmaster/class/:className
exports.getClassDetailedProgress = async (req, res) => {
    try {
        const { className } = req.params;

        const allocations = await Allocation.find({ className })
            .populate('teacher', 'name mobileNo')
            .sort({ section: 1 });

        // Batch: single Progress query for all allocations in this class
        const allocIds = allocations.map(a => a._id);
        const allProgress = await Progress.find({ allocation: { $in: allocIds } });

        const progressByAlloc = {};
        for (const p of allProgress) {
            const key = p.allocation.toString();
            if (!progressByAlloc[key]) progressByAlloc[key] = [];
            progressByAlloc[key].push(p);
        }

        const classDetails = [];
        for (const alloc of allocations) {
            const progressRecords = progressByAlloc[alloc._id.toString()] || [];
            const totalSubtopics = (alloc.topics || []).reduce((sum, t) => sum + (t.subtopics?.length || 0), 0);
            const completedRecords = progressRecords.filter(p => p.status === 'completed');

            classDetails.push({
                teacher: alloc.teacher,
                subject: alloc.subject,
                section: alloc.section,
                startDate: alloc.startDate,
                endDate: alloc.endDate,
                comment: alloc.comment || 'No comment',
                topics: alloc.topics,
                totalTopics: totalSubtopics,
                completedTopics: completedRecords.length,
                progress: totalSubtopics > 0 ? Math.round((completedRecords.length / totalSubtopics) * 100) : 0,
                completedSubtopicIds: completedRecords.map(p => p.subtopicId.toString())
            });
        }

        res.status(200).json({ className, details: classDetails });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get progress for a specific subject in a class, across all its sections
// @route   GET /api/headmaster/class/:className/subject/:subject
exports.getSubjectProgress = async (req, res) => {
    try {
        const { className, subject } = req.params;

        const allocations = await Allocation.find({ className, subject })
            .populate('teacher', 'name mobileNo')
            .sort({ section: 1 });

        if (allocations.length === 0) {
            return res.status(404).json({ message: 'No subject allocation found for this class' });
        }

        // Batch: single Progress query for all relevant allocations
        const allocIds = allocations.map(a => a._id);
        const allProgress = await Progress.find({ allocation: { $in: allocIds } });

        const progressByAlloc = {};
        for (const p of allProgress) {
            const key = p.allocation.toString();
            if (!progressByAlloc[key]) progressByAlloc[key] = [];
            progressByAlloc[key].push(p);
        }

        let totalTopics = 0;
        let totalCompleted = 0;
        const sections = [];

        for (const alloc of allocations) {
            const progressRecords = progressByAlloc[alloc._id.toString()] || [];
            const sectionTotalTopics = (alloc.topics || []).reduce((sum, t) => sum + (t.subtopics?.length || 0), 0);
            const completedRecords = progressRecords.filter(p => p.status === 'completed');

            totalTopics += sectionTotalTopics;
            totalCompleted += completedRecords.length;

            sections.push({
                section: alloc.section,
                teacher: alloc.teacher,
                startDate: alloc.startDate,
                endDate: alloc.endDate,
                topics: alloc.topics,
                totalTopics: sectionTotalTopics,
                completedTopics: completedRecords.length,
                progress: sectionTotalTopics > 0 ? Math.round((completedRecords.length / sectionTotalTopics) * 100) : 0,
                completedSubtopicIds: completedRecords.map(p => p.subtopicId.toString())
            });
        }

        res.status(200).json({
            className,
            subject,
            totalTopics,
            completedTopics: totalCompleted,
            progress: totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0,
            sections
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all teachers and their allocations
// @route   GET /api/headmaster/teachers
exports.getAllTeachersWithAllocations = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('-password');

        // Batch: get all allocations and progress in two queries
        const allAllocations = await Allocation.find({
            teacher: { $in: teachers.map(t => t._id) }
        });

        const allAllocIds = allAllocations.map(a => a._id);
        const allProgress = await Progress.find({
            allocation: { $in: allAllocIds },
            status: 'completed'
        }).select('allocation');

        const completedCountByAlloc = {};
        for (const p of allProgress) {
            const key = p.allocation.toString();
            completedCountByAlloc[key] = (completedCountByAlloc[key] || 0) + 1;
        }

        const allocationsByTeacher = {};
        for (const alloc of allAllocations) {
            const key = alloc.teacher.toString();
            if (!allocationsByTeacher[key]) allocationsByTeacher[key] = [];
            allocationsByTeacher[key].push(alloc);
        }

        const teachersData = teachers.map(teacher => {
            const allocations = allocationsByTeacher[teacher._id.toString()] || [];
            let totalTopics = 0;
            let totalCompleted = 0;

            for (const alloc of allocations) {
                totalTopics += (alloc.topics || []).reduce((sum, t) => sum + (t.subtopics?.length || 0), 0);
                totalCompleted += completedCountByAlloc[alloc._id.toString()] || 0;
            }

            return {
                teacher: {
                    id: teacher._id,
                    name: teacher.name,
                    mobileNo: teacher.mobileNo
                },
                allocations: allocations.length,
                totalTopics,
                totalCompleted,
                progress: totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0
            };
        });

        res.status(200).json(teachersData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
