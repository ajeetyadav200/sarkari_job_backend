const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const cyberCafeSchema = new mongoose.Schema(
    {
        cafeName: {
            type: String,
            trim: true,
            required: [true, "Cafe name is required"],
            minlength: [2, "Cafe name must be at least 2 characters"],
            maxlength: [100, "Cafe name cannot exceed 100 characters"]
        },

        ownerName: {
            type: String,
            trim: true,
            required: [true, "Owner name is required"],
            minlength: [2, "Owner name must be at least 2 characters"],
            maxlength: [50, "Owner name cannot exceed 50 characters"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"]
        },

        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true, required: [true, "City is required"] },
            state: { type: String, trim: true, required: [true, "State is required"] },
            pincode: { type: String, trim: true }
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isVerified: {
            type: Boolean,
            default: false
        },

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

// Virtual for account lock status
cyberCafeSchema.virtual("isLocked").get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for remaining lock time in hours
cyberCafeSchema.virtual("lockRemainingTime").get(function () {
    if (!this.lockUntil) return 0;
    return Math.ceil((this.lockUntil - Date.now()) / (1000 * 60 * 60));
});

// Pre-save middleware to hash password
cyberCafeSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(error);
    }
});

// Check if account is locked
cyberCafeSchema.methods.isAccountLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts and lock if exceeds limit
cyberCafeSchema.methods.incrementLoginAttempts = async function () {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.loginAttempts = 1;
        this.lockUntil = null;
    } else {
        this.loginAttempts += 1;
    }

    if (this.loginAttempts >= 3) {
        this.lockUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    }

    return await this.save();
};

// Reset login attempts after successful login
cyberCafeSchema.methods.resetLoginAttempts = async function () {
    if (this.loginAttempts > 0) {
        this.loginAttempts = 0;
        this.lockUntil = null;
        await this.save();
    }
};

// Enhanced password comparison with security tracking
cyberCafeSchema.methods.comparePassword = async function (candidatePassword) {
    if (this.isAccountLocked()) {
        const remainingTime = this.lockRemainingTime;
        throw new Error(`ACCOUNT_LOCKED: Account locked. Try again in ${remainingTime} hours.`);
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);

    if (isMatch) {
        await this.resetLoginAttempts();
        return true;
    } else {
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
cyberCafeSchema.methods.getJWT = function () {
    return jwt.sign(
        {
            id: this._id,
            type: "cyberCafe",
            email: this.email,
            cafeName: this.cafeName,
            ownerName: this.ownerName
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

module.exports = mongoose.model("CyberCafe", cyberCafeSchema);
