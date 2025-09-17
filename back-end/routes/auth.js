const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    checkPasswordStrength,
    setupTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    logout,
    registerValidation,
    loginValidation
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
    loginLimiter,
    registerLimiter,
    passwordResetLimiter
} = require('../middleware/security');

// Public routes
router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/check-password-strength', checkPasswordStrength);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);

// Two-factor authentication routes
router.post('/2fa/setup', authenticateToken, setupTwoFactor);
router.post('/2fa/verify', authenticateToken, verifyTwoFactor);
router.post('/2fa/disable', authenticateToken, disableTwoFactor);

module.exports = router;