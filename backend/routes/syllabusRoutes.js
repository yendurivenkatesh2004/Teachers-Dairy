const express = require('express');
const router = express.Router();
const {
    createSyllabus,
    deleteSyllabus,
    getTeacherAllocations,
    updateTopicStatus,
    getSections,
    getSubjectsByClass,
    updateAllocationComment
} = require('../controllers/syllabusController');
const { protect, authorize } = require('../middleware/authMiddleware');

// teacher, hm, deputy_hm, hod can all teach and manage their own syllabuses
router.use(protect, authorize('teacher', 'hm', 'deputy_hm', 'hod', 'principal'));
router.post('/create', createSyllabus);
router.get('/teacher/:teacherId', getTeacherAllocations);
router.patch('/update-topic', updateTopicStatus);
router.get('/sections', getSections);
router.get('/subjects', getSubjectsByClass);
router.patch('/:syllabusId/comment', updateAllocationComment);  // ← before the delete wildcard
router.delete('/:syllabusId', deleteSyllabus);

module.exports = router;
