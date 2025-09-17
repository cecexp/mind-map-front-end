const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Virtual for account locking
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Password validation middleware
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(this.password)) {
        const error = new Error('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character');
        return next(error);
    }

    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: {
                loginAttempts: 1,
                lockUntil: 1
            }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
        };
    }

    return this.updateOne(updates);
};

// Static method to get user for authentication
userSchema.statics.getAuthenticated = function (username, password) {
    return this.findOne({
        $or: [
            { username: username },
            { email: username }
        ]
    }).then(user => {
        if (!user) {
            return Promise.reject(new Error('User not found'));
        }

        if (user.isLocked) {
            return user.incLoginAttempts().then(() => {
                return Promise.reject(new Error('Account is temporarily locked due to too many failed login attempts'));
            });
        }

        return user.comparePassword(password).then(isMatch => {
            if (isMatch) {
                // Reset login attempts if password is correct
                if (user.loginAttempts || user.lockUntil) {
                    const updates = {
                        $unset: {
                            loginAttempts: 1,
                            lockUntil: 1
                        },
                        $set: {
                            lastActivity: new Date()
                        }
                    };
                    return user.updateOne(updates).then(() => user);
                }
                // Update last activity
                user.lastActivity = new Date();
                return user.save().then(() => user);
            } else {
                return user.incLoginAttempts().then(() => {
                    return Promise.reject(new Error('Invalid credentials'));
                });
            }
        });
    });
};

// Static method to validate password strength
userSchema.statics.validatePasswordStrength = function (password) {
    const criteria = {
        minLength: password.length >= 8,
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[@$!%*?&]/.test(password)
    };

    const score = Object.values(criteria).filter(Boolean).length;
    const isValid = Object.values(criteria).every(Boolean);

    return {
        isValid,
        score,
        criteria,
        strength: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong'
    };
};

module.exports = mongoose.model('User', userSchema);