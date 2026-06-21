const express = require('express');
const router = express.Router();
const {
    getClassesProgress,
    getClassDetailedProgress,
    getSubjectProgress,
    getAllTeachersWithAllocations
} = require('../controllers/headmasterController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('hm', 'deputy_hm', 'principal'));

router.get('/classes', getClassesProgress);
router.get('/class/:className', getClassDetailedProgress);
router.get('/class/:className/subject/:subject', getSubjectProgress);
router.get('/teachers', getAllTeachersWithAllocations);

module.exports = router;
