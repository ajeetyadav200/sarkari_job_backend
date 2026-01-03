


const User = require("../models/auth");
const IPAttempt = require("../models/IPAttempt");
const { 
    validateSignUpData, 
    validateLoginData, 
    validateAdminCreationData 
} = require("../utils/validation");

// Generate token and send response
const sendTokenResponse = (user, statusCode, res, message) => {
    const token = user.getJWT();

    const options = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            message,
            token,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin,
                    loginAttempts: user.loginAttempts,
                    attemptsRemaining: user.attemptsRemaining,
                    isLocked: user.isLocked
                }
            }
        });
};

// Get client IP address
const getClientIP = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
};

// @desc    Admin Signup (First time setup)
// @route   POST /api/auth/admin/signup
// @access  Public (Only for initial admin setup)
exports.adminSignup = async (req, res) => {
    try {
       
        const { firstName, lastName, email, password } = req.body;

        // Basic presence check
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "firstName, lastName, email and password are required"
            });
        }

     

        // Enforce max 2 admins
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount >= 2) {
            return res.status(403).json({
                success: false,
                message: "Maximum number of admin accounts (2) reached. Contact existing admin for access."
            });
        }

     

        // Normalize email and check existing user
        const normalizedEmail = String(email).toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email address"
            });
        }

        ("Creating admin user...");

        // Create admin user
        const admin = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password,
            role: "admin"
        });

        ("Admin user created, updating last login...");

        // Update last login and save
        admin.lastLogin = new Date();
        await admin.save();

        ("Sending token response...");

        // Send token + response
        return sendTokenResponse(admin, 201, res, "Admin account created successfully");

    } catch (error) {
        console.error("Admin signup error details:", error);

        // Duplicate key (email) error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email address"
            });
        }

        // Mongoose validation error (schema level)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: messages
            });
        }

        // Fallback with more detailed error
        return res.status(500).json({
            success: false,
            message: "Internal server error during admin signup",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Login for all users
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        ("Login request received");
        
        // Ensure body exists
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Request body is missing"
            });
        }

        const { email, password } = req.body;

        // Check input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const ipAddress = getClientIP(req);
        ("IP Address:", ipAddress);

        // Check if IP is locked first
        const isIPLocked = await IPAttempt.isIPLocked(ipAddress);
        if (isIPLocked) {
            return res.status(423).json({
                success: false,
                message: "Your IP address has been locked due to too many failed attempts. Try again in 24 hours."
            });
        }

        // Find user with password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        ("User found:", user ? "Yes" : "No");
        
        if (!user) {
            // Case 1: Email doesn't exist - increment IP attempt
            await IPAttempt.incrementIPAttempt(ipAddress);
            
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Your account has been deactivated. Please contact administrator."
            });
        }

        // Check if user account is locked
        if (user.isAccountLocked()) {
            const remainingTime = user.lockRemainingTime;
            return res.status(423).json({
                success: false,
                message: `Account locked. Try again in ${remainingTime} hours.`
            });
        }

        // Enhanced password check with security tracking
        try {
            const isPasswordValid = await user.comparePassword(password);
            
            if (isPasswordValid) {
                // Reset IP attempts on successful login
                await IPAttempt.resetIPAttempts(ipAddress);
                
                // Update last login
                user.lastLogin = new Date();
                await user.save();
                
                ("Login successful for user:", user.email);
                return sendTokenResponse(user, 200, res, "Login successful");
            }
        } catch (error) {
            // Handle security-related errors from comparePassword
            if (error.message.includes('ACCOUNT_LOCKED')) {
                return res.status(423).json({
                    success: false,
                    message: error.message.replace('ACCOUNT_LOCKED: ', '')
                });
            }
            
            if (error.message.includes('INVALID_PASSWORD')) {
                return res.status(401).json({
                    success: false,
                    message: error.message.replace('INVALID_PASSWORD: ', '')
                });
            }
            
            throw error;
        }

    } catch (error) {
        console.error("Login error:", error);
        
        // Handle specific security errors already handled above
        if (error.message.includes('ACCOUNT_LOCKED') || error.message.includes('INVALID_PASSWORD')) {
            return; // Already handled
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error during login"
        });
    }
};

// @desc    Create Assistant or Publisher (Admin only)
// @route   POST /api/auth/create-user
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, phone } = req.body;

        // Validate input data
        const validationErrors = validateAdminCreationData(req);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email address"
            });
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            role
        });

        return res.status(201).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        console.error("Create user error:", error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email address"
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: messages
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error while creating user"
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                    loginAttempts: user.loginAttempts,
                    attemptsRemaining: user.attemptsRemaining,
                    isLocked: user.isLocked
                }
            }
        });

    } catch (error) {
        console.error("Get me error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user profile"
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000), // 10 seconds
            httpOnly: true
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Error during logout"
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const updateFields = {};

        if (firstName) updateFields.firstName = firstName;
        if (lastName) updateFields.lastName = lastName;
        if (phone) updateFields.phone = phone;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateFields,
            { 
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: { user }
        });

    } catch (error) {
        console.error("Update profile error:", error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: messages
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error updating profile"
        });
    }
};

// @desc    Unlock user account (Admin only)
// @route   POST /api/auth/unlock-account/:userId
// @access  Private/Admin
exports.unlockUserAccount = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User account unlocked successfully"
        });

    } catch (error) {
        console.error("Unlock account error:", error);
        return res.status(500).json({
            success: false,
            message: "Error unlocking account"
        });
    }
};

// @desc    Unlock IP address (Admin only)
// @route   POST /api/auth/unlock-ip/:ipAddress
// @access  Private/Admin
exports.unlockIPAddress = async (req, res) => {
    try {
        const { ipAddress } = req.params;

        const ipRecord = await IPAttempt.findOne({ ipAddress });
        if (!ipRecord) {
            return res.status(404).json({
                success: false,
                message: "IP address record not found"
            });
        }

        await ipRecord.resetAttempts();

        return res.status(200).json({
            success: true,
            message: "IP address unlocked successfully"
        });

    } catch (error) {
        console.error("Unlock IP error:", error);
        return res.status(500).json({
            success: false,
            message: "Error unlocking IP address"
        });
    }
};