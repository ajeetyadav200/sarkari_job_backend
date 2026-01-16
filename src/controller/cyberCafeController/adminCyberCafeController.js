const CyberCafe = require("../../models/cyberCafe/cyberCafeSchema");

// Get all cyber cafes with pagination, search, and filters
exports.getAllCyberCafes = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            status = "all", // all, verified, unverified, active, inactive
            sortBy = "createdAt",
            sortOrder = "desc",
            state = "",
            city = ""
        } = req.query;

        // Build query
        const query = {};

        // Search by cafe name, owner name, email, or phone
        if (search) {
            query.$or = [
                { cafeName: { $regex: search, $options: "i" } },
                { ownerName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        // Filter by status
        if (status === "verified") {
            query.isVerified = true;
        } else if (status === "unverified") {
            query.isVerified = false;
        } else if (status === "active") {
            query.isActive = true;
        } else if (status === "inactive") {
            query.isActive = false;
        }

        // Filter by state
        if (state) {
            query["address.state"] = { $regex: state, $options: "i" };
        }

        // Filter by city
        if (city) {
            query["address.city"] = { $regex: city, $options: "i" };
        }

        // Calculate skip
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Get total count
        const total = await CyberCafe.countDocuments(query);

        // Get cyber cafes
        const cyberCafes = await CyberCafe.find(query)
            .select("-password")
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get statistics
        const stats = await CyberCafe.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
                    unverified: { $sum: { $cond: ["$isVerified", 0, 1] } },
                    active: { $sum: { $cond: ["$isActive", 1, 0] } },
                    inactive: { $sum: { $cond: ["$isActive", 0, 1] } }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                cyberCafes,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                stats: stats[0] || {
                    total: 0,
                    verified: 0,
                    unverified: 0,
                    active: 0,
                    inactive: 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching cyber cafes",
            error: error.message
        });
    }
};

// Get single cyber cafe by ID
exports.getCyberCafeById = async (req, res) => {
    try {
        const { id } = req.params;

        const cyberCafe = await CyberCafe.findById(id).select("-password");

        if (!cyberCafe) {
            return res.status(404).json({
                success: false,
                message: "Cyber cafe not found"
            });
        }

        res.status(200).json({
            success: true,
            data: cyberCafe
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching cyber cafe",
            error: error.message
        });
    }
};

// Verify cyber cafe
exports.verifyCyberCafe = async (req, res) => {
    try {
        const { id } = req.params;

        const cyberCafe = await CyberCafe.findByIdAndUpdate(
            id,
            { isVerified: true },
            { new: true }
        ).select("-password");

        if (!cyberCafe) {
            return res.status(404).json({
                success: false,
                message: "Cyber cafe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cyber cafe verified successfully",
            data: cyberCafe
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error verifying cyber cafe",
            error: error.message
        });
    }
};

// Unverify cyber cafe
exports.unverifyCyberCafe = async (req, res) => {
    try {
        const { id } = req.params;

        const cyberCafe = await CyberCafe.findByIdAndUpdate(
            id,
            { isVerified: false },
            { new: true }
        ).select("-password");

        if (!cyberCafe) {
            return res.status(404).json({
                success: false,
                message: "Cyber cafe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cyber cafe unverified successfully",
            data: cyberCafe
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error unverifying cyber cafe",
            error: error.message
        });
    }
};

// Toggle cyber cafe active status
exports.toggleActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const cyberCafe = await CyberCafe.findById(id);

        if (!cyberCafe) {
            return res.status(404).json({
                success: false,
                message: "Cyber cafe not found"
            });
        }

        cyberCafe.isActive = !cyberCafe.isActive;
        await cyberCafe.save();

        res.status(200).json({
            success: true,
            message: `Cyber cafe ${cyberCafe.isActive ? "activated" : "deactivated"} successfully`,
            data: {
                _id: cyberCafe._id,
                isActive: cyberCafe.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error toggling cyber cafe status",
            error: error.message
        });
    }
};

// Delete cyber cafe
exports.deleteCyberCafe = async (req, res) => {
    try {
        const { id } = req.params;

        const cyberCafe = await CyberCafe.findByIdAndDelete(id);

        if (!cyberCafe) {
            return res.status(404).json({
                success: false,
                message: "Cyber cafe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cyber cafe deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting cyber cafe",
            error: error.message
        });
    }
};

// Unlock cyber cafe account
exports.unlockAccount = async (req, res) => {
    try {
        const { id } = req.params;

        const cyberCafe = await CyberCafe.findByIdAndUpdate(
            id,
            {
                loginAttempts: 0,
                lockUntil: null
            },
            { new: true }
        ).select("-password");

        if (!cyberCafe) {
            return res.status(404).json({
                success: false,
                message: "Cyber cafe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Account unlocked successfully",
            data: cyberCafe
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error unlocking account",
            error: error.message
        });
    }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        // Get basic stats
        const stats = await CyberCafe.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
                    unverified: { $sum: { $cond: ["$isVerified", 0, 1] } },
                    active: { $sum: { $cond: ["$isActive", 1, 0] } },
                    inactive: { $sum: { $cond: ["$isActive", 0, 1] } }
                }
            }
        ]);

        // Get state-wise distribution
        const stateWise = await CyberCafe.aggregate([
            {
                $group: {
                    _id: "$address.state",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get recent registrations (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentRegistrations = await CyberCafe.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Get recent cyber cafes
        const recentCafes = await CyberCafe.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(5);

        // Get locked accounts
        const lockedAccounts = await CyberCafe.countDocuments({
            lockUntil: { $gt: new Date() }
        });

        res.status(200).json({
            success: true,
            data: {
                stats: stats[0] || {
                    total: 0,
                    verified: 0,
                    unverified: 0,
                    active: 0,
                    inactive: 0
                },
                stateWise,
                recentRegistrations,
                recentCafes,
                lockedAccounts
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard stats",
            error: error.message
        });
    }
};

// Bulk verify cyber cafes
exports.bulkVerify = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide an array of cyber cafe IDs"
            });
        }

        const result = await CyberCafe.updateMany(
            { _id: { $in: ids } },
            { isVerified: true }
        );

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} cyber cafes verified successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error bulk verifying cyber cafes",
            error: error.message
        });
    }
};

// Bulk delete cyber cafes
exports.bulkDelete = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide an array of cyber cafe IDs"
            });
        }

        const result = await CyberCafe.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} cyber cafes deleted successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error bulk deleting cyber cafes",
            error: error.message
        });
    }
};
