const CyberCafe = require("../../models/cyberCafe/cyberCafeSchema");
const bcrypt = require("bcryptjs");

// Generate token and send response
const sendTokenResponse = (cafe, statusCode, res, message) => {
    const token = cafe.getJWT();

    const options = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    res.status(statusCode)
        .cookie('cyberCafeToken', token, options)
        .json({
            success: true,
            message,
            token,
            data: {
                cafe: {
                    id: cafe._id,
                    cafeName: cafe.cafeName,
                    ownerName: cafe.ownerName,
                    email: cafe.email,
                    phone: cafe.phone,
                    address: cafe.address,
                    isActive: cafe.isActive,
                    isVerified: cafe.isVerified,
                    lastLogin: cafe.lastLogin
                }
            }
        });
};

// @desc    Cyber Cafe Signup
// @route   POST /api/cyber-cafe/signup
// @access  Public
exports.signup = async (req, res) => {
    try {
        const { cafeName, ownerName, email, phone, password, address } = req.body;

        // Basic presence check
        if (!cafeName || !ownerName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Cafe name, owner name, email, phone, and password are required"
            });
        }

        if (!address || !address.city || !address.state) {
            return res.status(400).json({
                success: false,
                message: "City and State are required in address"
            });
        }

        // Normalize email and check existing user
        const normalizedEmail = String(email).toLowerCase().trim();
        const existingCafe = await CyberCafe.findOne({ email: normalizedEmail });
        if (existingCafe) {
            return res.status(400).json({
                success: false,
                message: "Cyber cafe already registered with this email address"
            });
        }

        // Create cyber cafe account
        const cafe = await CyberCafe.create({
            cafeName: cafeName.trim(),
            ownerName: ownerName.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            password,
            address: {
                street: address.street?.trim() || "",
                city: address.city.trim(),
                state: address.state.trim(),
                pincode: address.pincode?.trim() || ""
            }
        });

        // Update last login and save
        cafe.lastLogin = new Date();
        await cafe.save();

        return sendTokenResponse(cafe, 201, res, "Cyber cafe account created successfully");

    } catch (error) {
        console.error("Cyber cafe signup error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Cyber cafe already registered with this email address"
            });
        }

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
            message: "Internal server error during signup"
        });
    }
};

// @desc    Cyber Cafe Login
// @route   POST /api/cyber-cafe/login
// @access  Public
exports.login = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Request body is missing"
            });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find cafe with password
        const cafe = await CyberCafe.findOne({ email: email.toLowerCase() }).select('+password');

        if (!cafe) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if cafe account is active
        if (!cafe.isActive) {
            return res.status(401).json({
                success: false,
                message: "Your account has been deactivated. Please contact administrator."
            });
        }

        // Check if account is locked
        if (cafe.isAccountLocked()) {
            const remainingTime = cafe.lockRemainingTime;
            return res.status(423).json({
                success: false,
                message: `Account locked. Try again in ${remainingTime} hours.`
            });
        }

        // Verify password
        try {
            const isPasswordValid = await cafe.comparePassword(password);

            if (isPasswordValid) {
                // Update last login
                cafe.lastLogin = new Date();
                await cafe.save();

                return sendTokenResponse(cafe, 200, res, "Login successful");
            }
        } catch (error) {
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
        console.error("Cyber cafe login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error during login"
        });
    }
};

// @desc    Get current cyber cafe profile
// @route   GET /api/cyber-cafe/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const cafe = await CyberCafe.findById(req.cyberCafe.id);

        if (!cafe) {
            return res.status(404).json({
                success: false,
                message: "Cyber cafe not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                cafe: {
                    id: cafe._id,
                    cafeName: cafe.cafeName,
                    ownerName: cafe.ownerName,
                    email: cafe.email,
                    phone: cafe.phone,
                    address: cafe.address,
                    isActive: cafe.isActive,
                    isVerified: cafe.isVerified,
                    lastLogin: cafe.lastLogin,
                    createdAt: cafe.createdAt
                }
            }
        });

    } catch (error) {
        console.error("Get cyber cafe profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching profile"
        });
    }
};

// @desc    Logout cyber cafe
// @route   POST /api/cyber-cafe/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        res.cookie('cyberCafeToken', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error("Cyber cafe logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Error during logout"
        });
    }
};

// @desc    Update cyber cafe profile
// @route   PUT /api/cyber-cafe/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { cafeName, ownerName, phone, address } = req.body;
        const updateFields = {};

        if (cafeName) updateFields.cafeName = cafeName;
        if (ownerName) updateFields.ownerName = ownerName;
        if (phone) updateFields.phone = phone;
        if (address) updateFields.address = address;

        const cafe = await CyberCafe.findByIdAndUpdate(
            req.cyberCafe.id,
            updateFields,
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: { cafe }
        });

    } catch (error) {
        console.error("Update cyber cafe profile error:", error);

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
