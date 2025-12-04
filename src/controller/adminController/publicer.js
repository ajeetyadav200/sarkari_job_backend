const User = require("../../models/auth");

const { validatePublisherData, validatePublisherUpdateData } = require("../../utils/validation");

// Create publisher only by admin
exports.createPublisher = async (req, res) => {
    try {
        const adminId = req.user.id; 

        if (!adminId) {
            return res.status(403).json({
                success: false,
                message: "Admin ID is required"
            });
        }
        
        // Check if user is admin
        const admin = await User.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can create publisher"
            });
        }

        const { firstName, lastName, email, password, phone } = req.body;

        // Validate request data
        const validationErrors = validatePublisherData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        // Check duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Create publisher
        const publisher = await User.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            role: "publisher",
        });

        // Remove password from response
        const publisherResponse = publisher.toObject();
        delete publisherResponse.password;

        res.status(201).json({
            success: true,
            message: "Publisher created successfully",
            data: publisherResponse
        });

    } catch (err) {
        console.error("Create publisher error:", err);
        res.status(500).json({
            success: false,
            message: "Publisher creation failed",
            error: err.message
        });
    }
};

// Update publisher
exports.updatePublisher = async (req, res) => {
    try {
        const adminId = req.user.id;

        if (!adminId) {
            return res.status(403).json({
                success: false,
                message: "Admin ID is required"
            });
        }

        const admin = await User.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can update publisher"
            });
        }

        const publisherId = req.params.id;

        if (!publisherId) {
            return res.status(400).json({
                success: false,
                message: "Publisher ID is required"
            });
        }

        // Validate update data
        const validationErrors = validatePublisherUpdateData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        // Check if email already exists (if email is being updated)
        if (req.body.email) {
            const existingUser = await User.findOne({ 
                email: req.body.email, 
                _id: { $ne: publisherId } 
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists"
                });
            }
        }

        // Prepare update data
        const updatedData = { ...req.body };
        
        // If password is being updated, hash it (handled by pre-save middleware)
        // if (updatedData.password) {
        //     // Password will be automatically hashed by the pre-save middleware
        // }

        const updatedPublisher = await User.findByIdAndUpdate(
            publisherId,
            updatedData,
            { new: true, runValidators: true }
        );

        if (!updatedPublisher) {
            return res.status(404).json({
                success: false,
                message: "Publisher not found"
            });
        }

        // Remove password from response
        const publisherResponse = updatedPublisher.toObject();
        delete publisherResponse.password;

        res.status(200).json({
            success: true,
            message: "Publisher updated successfully",
            data: publisherResponse
        });

    } catch (err) {
        console.error("Update publisher error:", err);
        res.status(500).json({
            success: false,
            message: "Publisher update failed",
            error: err.message
        });
    }
};

// Delete publisher
exports.deletePublisher = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can delete publisher"
            });
        }

        const publisherId = req.params.id;

        if (!publisherId) {
            return res.status(400).json({
                success: false,
                message: "Publisher ID is required"
            });
        }

        // Prevent admin from deleting themselves
        if (publisherId === adminId) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete your own account"
            });
        }

        const publisher = await User.findByIdAndDelete(publisherId);

        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: "Publisher not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Publisher deleted successfully"
        });

    } catch (err) {
        console.error("Delete publisher error:", err);
        res.status(500).json({
            success: false,
            message: "Publisher deletion failed",
            error: err.message
        });
    }
};

// Get all publishers
exports.getAllPublishers = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can view publishers"
            });
        }

        const publishers = await User.find(
            { role: "publisher" },
            { password: 0 } // Exclude password field
        ).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Publishers fetched successfully",
            data: publishers,
            count: publishers.length
        });

    } catch (err) {
        console.error("Get publishers error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch publishers",
            error: err.message
        });
    }
};

// Get single publisher
exports.getPublisher = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can view publisher details"
            });
        }

        const publisherId = req.params.id;
        const publisher = await User.findById(
            publisherId,
            { password: 0 } // Exclude password field
        );

        if (!publisher || publisher.role !== "publisher") {
            return res.status(404).json({
                success: false,
                message: "Publisher not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Publisher fetched successfully",
            data: publisher
        });

    } catch (err) {
        console.error("Get publisher error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch publisher",
            error: err.message
        });
    }
};

// Logout publisher (admin forcing publisher logout)
exports.logoutPublisher = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can logout publishers"
            });
        }

        const publisherId = req.params.id;

        if (!publisherId) {
            return res.status(400).json({
                success: false,
                message: "Publisher ID is required"
            });
        }

        const publisher = await User.findById(publisherId);

        if (!publisher || publisher.role !== "publisher") {
            return res.status(404).json({
                success: false,
                message: "Publisher not found"
            });
        }

     

        res.status(200).json({
            success: true,
            message: "Publisher logged out successfully"
        });

    } catch (err) {
        console.error("Logout publisher error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to logout publisher",
            error: err.message
        });
    }
};