const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Handles registering new system users (defaults to role: 'teacher')
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Validates credentials using mobile number parity and returns a signed JWT token
router.post('/login', login);

module.exports = router;