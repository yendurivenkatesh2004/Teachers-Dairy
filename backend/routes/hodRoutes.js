const express = require('express');
const router = express.Router();
const {
    setupProfile,
    getProfile,
    getAvailableClasses,
    getAvailableSubjects,
    getProgress
} = require('../controllers/hodController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('hod'));

router.post('/setup', setupProfile);
router.get('/profile', getProfile);
router.get('/classes', getAvailableClasses);
router.get('/subjects', getAvailableSubjects);
router.get('/progress', getProgress);

module.exports = router;
