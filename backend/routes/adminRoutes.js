const express = require('express');
const router = express.Router();
const {
    createSection,
    deleteSection,
    getAllSections,
    getAllTeachers,
    getAllUsers,
    deRegisterUser,
    getAllAllocations,
    getAllSyllabuses,
    createSubject,
    getAllSubjects,
    deleteSubject
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/authMiddleware');

// PROTECT ALL ROUTES: Restrict entirely to authenticated Admins
router.use(protect, authorize('admin'));

// Sections Management
router.post('/sections', createSection);
router.delete('/sections/:sectionId', deleteSection);
router.get('/sections', getAllSections);

// Subject Management
router.post('/subjects', createSubject);
router.get('/subjects', getAllSubjects);
router.delete('/subjects/:subjectId', deleteSubject);

// User Management
router.get('/users', getAllUsers);
router.get('/teachers', getAllTeachers);
router.delete('/users/:userId', deRegisterUser);

// System-Wide Monitoring (Read-Only Audits)
router.get('/allocations', getAllAllocations);
router.get('/syllabuses', getAllSyllabuses);

module.exports = router;
