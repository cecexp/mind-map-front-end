const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// In-memory storage as fallback when database is not available
let inMemoryUsers = [];
let nextUserId = 1;

// Function to clear all users (for development/testing)
const clearAllUsers = () => {
    inMemoryUsers = [];
    nextUserId = 1;
    console.log('🧹 All users cleared from in-memory storage');
};

// Clear users on server start
clearAllUsers();

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
};

// Helper function to create user object for in-memory storage
const createUserObject = (userData) => {
    const now = new Date();
    return {
        _id: nextUserId++,
        username: userData.username,
        email: userData.email,
        password: userData.password, // Should be hashed
        isEmailVerified: false,
        twoFactorEnabled: false,
        loginAttempts: 0,
        lastActivity: now,
        createdAt: now,
        updatedAt: now
    };
};

// Helper function to hash password
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 12);
};

// Helper function to compare password
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Validation rules
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
];

const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username or email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Register new user
const register = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        console.log('📝 Registration attempt:', { username, email });

        let existingUser;
        let savedUser;

        if (isMongoConnected()) {
            // Check if user already exists in MongoDB
            existingUser = await User.findOne({
                $or: [{ username }, { email }]
            });
        } else {
            // Check if user already exists in memory
            existingUser = inMemoryUsers.find(user =>
                user.username === username || user.email === email
            );
        }

        if (existingUser) {
            console.log('❌ User already exists:', {
                existingUsername: existingUser.username,
                existingEmail: existingUser.email
            });
            return res.status(409).json({
                success: false,
                message: `${existingUser.username === username ? 'Username' : 'Email'} already exists`
            });
        }

        // Validate password strength (simplified for in-memory)
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        if (isMongoConnected()) {
            // Use MongoDB
            const passwordValidation = User.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet security requirements',
                    passwordCriteria: passwordValidation.criteria
                });
            }

            // Create new user
            const user = new User({
                username,
                email,
                password,
                emailVerificationToken: crypto.randomBytes(32).toString('hex')
            });

            savedUser = await user.save();
        } else {
            // Use in-memory storage
            const hashedPassword = await hashPassword(password);
            savedUser = createUserObject({
                username,
                email,
                password: hashedPassword
            });
            inMemoryUsers.push(savedUser);
        }

        console.log('✅ User created successfully:', savedUser.username);

        // Generate JWT token
        const token = generateToken(savedUser._id);

        // Remove sensitive data from response
        const userResponse = {
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            isEmailVerified: savedUser.isEmailVerified,
            twoFactorEnabled: savedUser.twoFactorEnabled,
            createdAt: savedUser.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, password, twoFactorCode } = req.body;

        console.log('🔐 Login attempt:', { username });
        console.log('🗃️ Available users in memory:', inMemoryUsers.map(u => ({ username: u.username, email: u.email })));

        let user;

        if (isMongoConnected()) {
            // Authenticate user with MongoDB
            user = await User.getAuthenticated(username, password);
        } else {
            // Authenticate user with in-memory storage
            const foundUser = inMemoryUsers.find(u =>
                u.username === username || u.email === username
            );

            console.log('🔍 Found user:', foundUser ? { username: foundUser.username, email: foundUser.email } : 'No user found');

            if (!foundUser) {
                throw new Error('User not found');
            }

            const isMatch = await comparePassword(password, foundUser.password);
            console.log('🔒 Password match:', isMatch);

            if (!isMatch) {
                throw new Error('Invalid password');
            }

            // Update last activity
            foundUser.lastActivity = new Date();
            user = foundUser;
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            if (!twoFactorCode) {
                return res.status(200).json({
                    success: true,
                    message: 'Two-factor authentication required',
                    requiresTwoFactor: true,
                    userId: user._id
                });
            }

            // Verify 2FA code
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 2
            });

            if (!verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid two-factor authentication code'
                });
            }
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Remove sensitive data from response
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            lastActivity: user.lastActivity
        };

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            message: error.message || 'Authentication failed'
        });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userResponse = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            isEmailVerified: req.user.isEmailVerified,
            twoFactorEnabled: req.user.twoFactorEnabled,
            lastActivity: req.user.lastActivity,
            createdAt: req.user.createdAt
        };

        res.json({
            success: true,
            data: { user: userResponse }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Check password strength
const checkPasswordStrength = (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Password is required'
        });
    }

    const validation = User.validatePasswordStrength(password);

    res.json({
        success: true,
        data: validation
    });
};

// Setup two-factor authentication
const setupTwoFactor = async (req, res) => {
    try {
        const user = req.user;

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `MindMaps App (${user.username})`,
            issuer: 'MindMaps App',
            length: 32
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Temporarily store secret (will be saved permanently when verified)
        req.session = req.session || {};
        req.session.tempTwoFactorSecret = secret.base32;

        res.json({
            success: true,
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntryKey: secret.base32
            }
        });

    } catch (error) {
        console.error('Setup 2FA error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to setup two-factor authentication'
        });
    }
};

// Verify and enable two-factor authentication
const verifyTwoFactor = async (req, res) => {
    try {
        const { token } = req.body;
        const user = req.user;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification code is required'
            });
        }

        // Get temporary secret from session
        const tempSecret = req.session?.tempTwoFactorSecret;
        if (!tempSecret) {
            return res.status(400).json({
                success: false,
                message: 'No setup session found. Please start the setup process again.'
            });
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: tempSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Save the secret and enable 2FA
        await User.findByIdAndUpdate(user._id, {
            twoFactorSecret: tempSecret,
            twoFactorEnabled: true
        });

        // Clear temporary secret
        delete req.session.tempTwoFactorSecret;

        res.json({
            success: true,
            message: 'Two-factor authentication enabled successfully'
        });

    } catch (error) {
        console.error('Verify 2FA error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify two-factor authentication'
        });
    }
};

// Disable two-factor authentication
const disableTwoFactor = async (req, res) => {
    try {
        const { password } = req.body;
        const user = req.user;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to disable two-factor authentication'
            });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Disable 2FA
        await User.findByIdAndUpdate(user._id, {
            twoFactorSecret: null,
            twoFactorEnabled: false
        });

        res.json({
            success: true,
            message: 'Two-factor authentication disabled successfully'
        });

    } catch (error) {
        console.error('Disable 2FA error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable two-factor authentication'
        });
    }
};

// Logout (client-side token removal, server can optionally blacklist tokens)
const logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = {
    register,
    login,
    getProfile,
    checkPasswordStrength,
    setupTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    logout,
    registerValidation,
    loginValidation,
    inMemoryUsers
};