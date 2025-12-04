const mongoose = require("mongoose");

const ipAttemptSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        required: true,
        index: true
    },
    
    attempts: {
        type: Number,
        default: 0
    },
    
    lastAttempt: {
        type: Date,
        default: Date.now
    },
    
    lockedUntil: {
        type: Date
    },
    
    isLocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Virtual for remaining lock time
ipAttemptSchema.virtual("lockRemainingTime").get(function() {
    if (!this.lockedUntil) return 0;
    return Math.ceil((this.lockedUntil - Date.now()) / (1000 * 60 * 60));
});

// Method to increment IP attempts
ipAttemptSchema.methods.incrementAttempt = async function() {
    this.attempts += 1;
    this.lastAttempt = new Date();
    
    // Lock IP if 3 failed attempts
    if (this.attempts >= 3) {
        this.isLocked = true;
        this.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }
    
    return await this.save();
};

// Method to reset IP attempts
ipAttemptSchema.methods.resetAttempts = async function() {
    this.attempts = 0;
    this.isLocked = false;
    this.lockedUntil = null;
    return await this.save();
};

// Static method to check if IP is locked
ipAttemptSchema.statics.isIPLocked = async function(ipAddress) {
    const ipRecord = await this.findOne({ ipAddress });
    
    if (!ipRecord || !ipRecord.isLocked) {
        return false;
    }
    
    // Check if lock period has expired
    if (ipRecord.lockedUntil && ipRecord.lockedUntil < new Date()) {
        await ipRecord.resetAttempts();
        return false;
    }
    
    return true;
};

// Static method to increment IP attempt
ipAttemptSchema.statics.incrementIPAttempt = async function(ipAddress) {
    let ipRecord = await this.findOne({ ipAddress });
    
    if (!ipRecord) {
        ipRecord = new this({ ipAddress });
    }
    
    return await ipRecord.incrementAttempt();
};

// Static method to reset IP attempts (on successful login)
ipAttemptSchema.statics.resetIPAttempts = async function(ipAddress) {
    const ipRecord = await this.findOne({ ipAddress });
    
    if (ipRecord) {
        return await ipRecord.resetAttempts();
    }
};

module.exports = mongoose.model("IPAttempt", ipAttemptSchema);