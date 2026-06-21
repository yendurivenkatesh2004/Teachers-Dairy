const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        // 1. Check if Authorization header exists and starts with Bearer
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authorized, no token provided' });
        }

        // 2. Extract token from header
        const token = authHeader.split(' ')[1];

        // 3. Verify token signature and expiry
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach user to request object (excluding password)
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user no longer exists' });
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Not authorized, token has expired' });
        }
        res.status(500).json({ message: 'Server error in auth middleware', error: error.message });
    }
};

// Role-based access control middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. This route is restricted to: ${roles.join(', ')}` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };