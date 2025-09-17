const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'mindmap_super_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m'; // 30 minutes

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper function to check storage type and get user
const getUserFromStorage = async (userId) => {
    const mongoose = require('mongoose');
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
        // Use MongoDB
        return {
            user: await User.findById(userId).select('-password -twoFactorSecret'),
            isMongoConnected: true
        };
    } else {
        // Use in-memory storage
        const { inMemoryUsers } = require('../controllers/authController');
        const foundUser = inMemoryUsers.find(u => u._id === userId);
        if (foundUser) {
            // Remove sensitive data
            const { password, twoFactorSecret, ...userWithoutSensitive } = foundUser;
            return {
                user: userWithoutSensitive,
                isMongoConnected: false
            };
        }
        return { user: null, isMongoConnected: false };
    }
};

// Helper function to update user activity
const updateUserActivity = async (user, isMongoConnected) => {
    if (isMongoConnected) {
        await User.findByIdAndUpdate(user._id, { lastActivity: new Date() });
    } else {
        // For in-memory storage, find the original user object and update it
        const { inMemoryUsers } = require('../controllers/authController');
        const originalUser = inMemoryUsers.find(u => u._id === user._id);
        if (originalUser) {
            originalUser.lastActivity = new Date();
        }
    }
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const { user, isMongoConnected } = await getUserFromStorage(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
        }

        // Check if user account is locked (only for MongoDB users)
        if (isMongoConnected && user.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked'
            });
        }

        // Check session timeout (30 minutes of inactivity)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (user.lastActivity && user.lastActivity < thirtyMinutesAgo) {
            return res.status(401).json({
                success: false,
                message: 'Session expired due to inactivity'
            });
        }

        // Update last activity
        await updateUserActivity(user, isMongoConnected);

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const { user, isMongoConnected } = await getUserFromStorage(decoded.userId);

            if (user && (!isMongoConnected || !user.isLocked)) {
                // Check session timeout
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                if (!user.lastActivity || user.lastActivity >= thirtyMinutesAgo) {
                    // Update last activity
                    await updateUserActivity(user, isMongoConnected);
                    req.user = user;
                }
            }
        }

        next();
    } catch (error) {
        // For optional auth, we don't fail on errors
        next();
    }
};

// Check if user is admin (for future use)
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

module.exports = {
    generateToken,
    authenticateToken,
    optionalAuth,
    requireAdmin,
    JWT_SECRET,
    JWT_EXPIRES_IN
};