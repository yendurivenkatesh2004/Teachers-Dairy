const express = require('express');
const router = express.Router();
const {
    createSyllabus,
    deleteSyllabus,
    getTeacherAllocations,
    updateTopicStatus,
    getSections,
    getSubjectsByClass
} = require('../controllers/syllabusController');
const { protect, authorize } = require('../middleware/authMiddleware');

// teacher, hm, deputy_hm, hod can all teach and manage their own syllabuses
router.use(protect, authorize('teacher', 'hm', 'deputy_hm', 'hod'));

router.post('/create', createSyllabus);
router.delete('/:syllabusId', deleteSyllabus);
router.get('/teacher/:teacherId', getTeacherAllocations);
router.patch('/update-topic', updateTopicStatus);
router.get('/sections', getSections);
router.get('/subjects', getSubjectsByClass);

module.exports = router;