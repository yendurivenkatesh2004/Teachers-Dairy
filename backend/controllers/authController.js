const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user (Admin/Teacher)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, mobileNo, password, role } = req.body;
        if (!name || !mobileNo || !password) {
           return res.status(400).json({ message: 'Name, mobile number and password are required' });
        }

        // 1. Check if user already exists (mobileNo is the sole unique identifier)
        const userExists = await User.findOne({ mobileNo });
        if (userExists) {
            return res.status(400).json({ message: 'User already registered with this mobile number' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create user document
        const user = await User.create({
            name,
            mobileNo,
            password: hashedPassword,
            role: role || 'teacher'
        });

        // 4. Respond with user details
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                mobileNo: user.mobileNo,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { mobileNo, password } = req.body;

        if (!mobileNo || !password) {
            return res.status(400).json({ message: 'Mobile number and password are required' });
        }
        
        const user = await User.findOne({ mobileNo });
        if (!user) {
            return res.status(401).json({ message: 'Invalid mobile number or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid mobile number or password' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                mobileNo: user.mobileNo,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};
