const Permission = require('../../models/permission/permissionSchema');
const User = require('../../models/auth');

/**
 * Permission Controller
 * Handles all permission-related operations
 */

/**
 * Get all users with their permissions
 * GET /api/permissions
 */
const getAllPermissions = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    // Build query for users (exclude admins from permission management)
    const userQuery = { role: { $in: ['assistant', 'publisher'] } };

    if (role && ['assistant', 'publisher'].includes(role)) {
      userQuery.role = role;
    }

    if (search) {
      userQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users
    const users = await User.find(userQuery)
      .select('firstName lastName email phone role isActive createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get permissions for these users
    const userIds = users.map(u => u._id);
    const permissions = await Permission.find({ userId: { $in: userIds } });

    // Map permissions to users
    const permissionMap = {};
    permissions.forEach(p => {
      permissionMap[p.userId.toString()] = p;
    });

    // Combine users with their permissions
    const usersWithPermissions = users.map(user => {
      const userObj = user.toObject();
      const userPermission = permissionMap[user._id.toString()];

      if (userPermission) {
        userObj.permissions = userPermission.getAllPermissions();
        userObj.permissionId = userPermission._id;
        userObj.permissionRemarks = userPermission.remarks;
        userObj.permissionActive = userPermission.isActive;
      } else {
        // Return default permissions based on role
        userObj.permissions = Permission.getDefaultPermissions(user.role);
        userObj.permissionId = null;
      }

      return userObj;
    });

    // Get total count
    const total = await User.countDocuments(userQuery);

    res.status(200).json({
      success: true,
      data: usersWithPermissions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get permission for a specific user
 * GET /api/permissions/:userId
 */
const getUserPermission = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user
    const user = await User.findById(userId).select('firstName lastName email phone role isActive');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get permission
    let permission = await Permission.findOne({ userId });

    if (!permission) {
      // Return default permissions based on role
      return res.status(200).json({
        success: true,
        data: {
          user,
          permissions: Permission.getDefaultPermissions(user.role),
          isDefault: true
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        permissions: permission.getAllPermissions(),
        permissionId: permission._id,
        remarks: permission.remarks,
        isActive: permission.isActive,
        assignedBy: permission.assignedBy,
        updatedAt: permission.updatedAt,
        isDefault: false
      }
    });
  } catch (error) {
    console.error('Get user permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user permission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update permissions for a user
 * PUT /api/permissions/:userId
 */
const updatePermission = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions, remarks, isActive = true } = req.body;

    // Verify user exists and is not admin
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin permissions'
      });
    }

    // Prepare permission data
    const permissionData = {
      userId,
      assignedBy: req.user._id,
      remarks,
      isActive,
      ...permissions
    };

    // Update or create permission
    let permission = await Permission.findOneAndUpdate(
      { userId },
      permissionData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data: {
        permissionId: permission._id,
        permissions: permission.getAllPermissions(),
        remarks: permission.remarks,
        isActive: permission.isActive
      }
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset permissions to default for a user
 * POST /api/permissions/:userId/reset
 */
const resetPermission = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin permissions'
      });
    }

    // Delete custom permission (will fall back to defaults)
    await Permission.findOneAndDelete({ userId });

    res.status(200).json({
      success: true,
      message: 'Permissions reset to default',
      data: {
        permissions: Permission.getDefaultPermissions(user.role),
        isDefault: true
      }
    });
  } catch (error) {
    console.error('Reset permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get my permissions (for logged-in user)
 * GET /api/permissions/me
 */
const getMyPermissions = async (req, res) => {
  try {
    const userId = req.user._id;

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return res.status(200).json({
        success: true,
        data: {
          permissions: Permission.getDefaultPermissions('admin'),
          isAdmin: true
        }
      });
    }

    // Get custom permission
    let permission = await Permission.findOne({ userId, isActive: true });

    if (permission) {
      return res.status(200).json({
        success: true,
        data: {
          permissions: permission.getAllPermissions(),
          isAdmin: false
        }
      });
    }

    // Return default permissions
    res.status(200).json({
      success: true,
      data: {
        permissions: Permission.getDefaultPermissions(req.user.role),
        isAdmin: false,
        isDefault: true
      }
    });
  } catch (error) {
    console.error('Get my permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Bulk update permissions for multiple users
 * POST /api/permissions/bulk
 */
const bulkUpdatePermissions = async (req, res) => {
  try {
    const { userIds, permissions, remarks } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    // Verify users exist and are not admins
    const users = await User.find({
      _id: { $in: userIds },
      role: { $ne: 'admin' }
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid users found'
      });
    }

    const validUserIds = users.map(u => u._id);

    // Update permissions for each user
    const bulkOps = validUserIds.map(userId => ({
      updateOne: {
        filter: { userId },
        update: {
          $set: {
            ...permissions,
            assignedBy: req.user._id,
            remarks,
            isActive: true
          }
        },
        upsert: true
      }
    }));

    await Permission.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: `Permissions updated for ${validUserIds.length} users`,
      data: {
        updatedCount: validUserIds.length
      }
    });
  } catch (error) {
    console.error('Bulk update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get available modules and actions
 * GET /api/permissions/modules
 */
const getModulesAndActions = async (req, res) => {
  try {
    const modules = [
      { key: 'jobs', label: 'Jobs', description: 'Job postings management' },
      { key: 'admissions', label: 'Admissions', description: 'Admission notifications' },
      { key: 'admitCards', label: 'Admit Cards', description: 'Admit card management' },
      { key: 'answerKeys', label: 'Answer Keys', description: 'Answer key management' },
      { key: 'results', label: 'Results', description: 'Result notifications' },
      { key: 'governmentServices', label: 'Government Services', description: 'Government services info' },
      { key: 'users', label: 'Users', description: 'User management' },
      { key: 'cyberCafe', label: 'Cyber Cafe', description: 'Cyber cafe tools' }
    ];

    const actions = [
      { key: 'create', label: 'Create', description: 'Can create new records' },
      { key: 'read', label: 'Read', description: 'Can view records' },
      { key: 'update', label: 'Update', description: 'Can edit records' },
      { key: 'delete', label: 'Delete', description: 'Can delete records' },
      { key: 'verify', label: 'Verify', description: 'Can verify/approve records' },
      { key: 'publish', label: 'Publish', description: 'Can publish records' }
    ];

    res.status(200).json({
      success: true,
      data: {
        modules,
        actions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch modules and actions'
    });
  }
};

module.exports = {
  getAllPermissions,
  getUserPermission,
  updatePermission,
  resetPermission,
  getMyPermissions,
  bulkUpdatePermissions,
  getModulesAndActions
};
