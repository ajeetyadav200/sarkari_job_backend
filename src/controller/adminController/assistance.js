

const User = require("../../models/auth");
const bcrypt = require("bcryptjs");
const { validateAssistantData, validateAssistantUpdateData } = require("../../utils/validation");

// Create assistant only by admin
exports.createAssistant = async (req, res) => {
    try {
        const adminId = req.user.id; 

        if (!adminId) {
             return res.status(403).json({
                success: false,
                message: "admin id is not found"
            });
        }
        
        // Check if user is admin
        const admin = await User.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can create assistant"
            });
        }

        const { firstName, lastName, email, password } = req.body;

        // Validate request data
        const validationErrors = validateAssistantData(req.body);
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

        // Create assistant
        const assistant = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: "assistant",
        });

        // Remove password from response
        const assistantResponse = assistant.toObject();
        delete assistantResponse.password;

        res.status(201).json({
            success: true,
            message: "Assistant created successfully",
            data: assistantResponse
        });

    } catch (err) {
        console.error("Create assistant error:", err);
        res.status(500).json({
            success: false,
            message: "Assistant creation failed",
            error: err.message
        });
    }
};

// Update assistant
exports.updateAssistant = async (req, res) => {
    try {
        const adminId = req.user.id;

         if (!adminId) {
             return res.status(403).json({
                success: false,
                message: "admin id is not found"
            });
        }


        const admin = await User.findById(adminId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can update assistant"
            });
        }

        const assistantId = req.params.id;


         if (!assistantId) {
             return res.status(403).json({
                success: false,
                message: "assistant id is not found"
            });
        }

        // Validate update data
        const validationErrors = validateAssistantUpdateData(req.body);
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
                _id: { $ne: assistantId } 
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
        
        // // If password is being updated, hash it
        // if (updatedData.password) {
        //     updatedData.password = await bcrypt.hash(updatedData.password, 12);
        // }

        const updatedAssistant = await User.findByIdAndUpdate(
            assistantId,
            updatedData,
            { new: true, runValidators: true }
        );

        if (!updatedAssistant) {
            return res.status(404).json({
                success: false,
                message: "Assistant not found"
            });
        }

        // Remove password from response
        const assistantResponse = updatedAssistant.toObject();
        delete assistantResponse.password;

        res.status(200).json({
            success: true,
            message: "Assistant updated successfully",
            data: assistantResponse
        });

    } catch (err) {
        console.error("Update assistant error:", err);
        res.status(500).json({
            success: false,
            message: "Assistant update failed",
            error: err.message
        });
    }
};

// Delete assistant
exports.deleteAssistant = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can delete assistant"
            });
        }

        const assistantId = req.params.id;

        // Prevent admin from deleting themselves
        if (assistantId === adminId) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete your own account"
            });
        }

        const assistant = await User.findByIdAndDelete(assistantId);

        if (!assistant) {
            return res.status(404).json({
                success: false,
                message: "Assistant not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Assistant deleted successfully"
        });

    } catch (err) {
        console.error("Delete assistant error:", err);
        res.status(500).json({
            success: false,
            message: "Assistant deletion failed",
            error: err.message
        });
    }
};

// Get all assistants
exports.getAllAssistants = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can view assistants"
            });
        }

        const assistants = await User.find(
            { role: "assistant" },
            { password: 0 } // Exclude password field
        ).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Assistants fetched successfully",
            data: assistants,
            count: assistants.length
        });

    } catch (err) {
        console.error("Get assistants error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch assistants",
            error: err.message
        });
    }
};

// Get single assistant
exports.getAssistant = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied! Only admin can view assistant details"
            });
        }

        const assistantId = req.params.id;
        const assistant = await User.findById(
            assistantId,
            { password: 0 } // Exclude password field
        );

        if (!assistant || assistant.role !== "assistant") {
            return res.status(404).json({
                success: false,
                message: "Assistant not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Assistant fetched successfully",
            data: assistant
        });

    } catch (err) {
        console.error("Get assistant error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch assistant",
            error: err.message
        });
    }
};