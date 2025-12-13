

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    validateEmail,
    validatePassword,
    validatePhone,
    validateName
} = require("../utils/validation");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true,
            required: [true, "First name is required"],
            minlength: [2, "First name must be at least 2 characters"],
            maxlength: [30, "First name cannot exceed 30 characters"],
            // validate: [validateName, "First name can only contain letters and spaces"]
        },

        lastName: {
            type: String,
            trim: true,
            required: [true, "Last name is required"],
            minlength: [2, "Last name must be at least 2 characters"],
            maxlength: [30, "Last name cannot exceed 30 characters"],
            // validate: [validateName, "Last name can only contain letters and spaces"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            // validate: [validateEmail, "Please provide a valid email address"]
        },

        phone: {
            type: String,
            // validate: [validatePhone, "Please provide a valid Indian phone number"]
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            // validate: [validatePassword, "Password must contain uppercase, lowercase and number"]
        },

        role: {
            type: String,
            enum: {
                values: ["admin", "assistant", "publisher"],
                message: "Role must be admin, assistant, or publisher"
            },
            default: "publisher"
        },

        isActive: {
            type: Boolean,
            default: true
        },

        // Security Fields
        loginAttempts: {
            type: Number,
            default: 0
        },

        lockUntil: {
            type: Date
        },

        lastLogin: Date
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for full name
userSchema.virtual("fullName").get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual("isLocked").get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for remaining lock time in hours
userSchema.virtual("lockRemainingTime").get(function() {
    if (!this.lockUntil) return 0;
    return Math.ceil((this.lockUntil - Date.now()) / (1000 * 60 * 60));
});

// Virtual for attempts remaining
userSchema.virtual("attemptsRemaining").get(function() {
    return Math.max(0, 3 - this.loginAttempts);
});

// Pre-save middleware to hash password
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(error);
    }
});

// Security Methods

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts and lock if exceeds limit
userSchema.methods.incrementLoginAttempts = async function() {
    // If lock has expired, reset attempts
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.loginAttempts = 1;
        this.lockUntil = null;
    } else {
        this.loginAttempts += 1;
    }

    // Lock account if attempts exceed limit
    if (this.loginAttempts >= 3) {
        this.lockUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    }

    return await this.save();
};

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = async function() {
    if (this.loginAttempts > 0) {
        this.loginAttempts = 0;
        this.lockUntil = null;
        await this.save();
    }
};

// Enhanced password comparison with security tracking
userSchema.methods.comparePassword = async function(candidatePassword) {
    // Check if account is locked
    if (this.isAccountLocked()) {
        const remainingTime = this.lockRemainingTime;
        throw new Error(`ACCOUNT_LOCKED: Account locked. Try again in ${remainingTime} hours.`);
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    if (isMatch) {
        // Reset attempts on successful login
        await this.resetLoginAttempts();
        return true;
    } else {
        // Increment attempts and potentially lock account
        await this.incrementLoginAttempts();
        
        const attemptsLeft = 3 - this.loginAttempts;
        if (attemptsLeft > 0) {
            throw new Error(`INVALID_PASSWORD: Invalid password. ${attemptsLeft} attempts remaining.`);
        } else {
            throw new Error('ACCOUNT_LOCKED: Account locked due to too many failed attempts. Try again in 24 hours.');
        }
    }
};

// Generate JWT token
userSchema.methods.getJWT = function() {
    return jwt.sign(
        { 
            id: this._id, 
            role: this.role,
            email: this.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

// Check if user is admin
userSchema.methods.isAdmin = function() { return this.role === "admin"; };
userSchema.methods.isAssistant = function() { return this.role === "assistant"; };
userSchema.methods.isPublisher = function() { return this.role === "publisher"; };

module.exports = mongoose.model("User", userSchema);