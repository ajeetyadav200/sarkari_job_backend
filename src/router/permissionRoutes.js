const express = require('express');
const router = express.Router();
const { AuthUser, requireAdmin } = require('../middleware/authMiddleware');

const {
  getAllPermissions,
  getUserPermission,
  updatePermission,
  resetPermission,
  getMyPermissions,
  bulkUpdatePermissions,
  getModulesAndActions
} = require('../controller/permissionController/permissionController');

/**
 * Permission Routes
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(AuthUser);

// ==================== USER ROUTES ====================

/**
 * @route   GET /api/permissions/me
 * @desc    Get logged-in user's permissions
 * @access  Private (Any authenticated user)
 */
router.get('/me', getMyPermissions);

/**
 * @route   GET /api/permissions/modules
 * @desc    Get available modules and actions
 * @access  Private (Any authenticated user)
 */
router.get('/modules', getModulesAndActions);

// ==================== ADMIN ONLY ROUTES ====================

// Apply admin middleware to all routes below
router.use(requireAdmin);

/**
 * @route   GET /api/permissions
 * @desc    Get all users with their permissions
 * @access  Private (Admin only)
 */
router.get('/', getAllPermissions);

/**
 * @route   GET /api/permissions/:userId
 * @desc    Get permission for a specific user
 * @access  Private (Admin only)
 */
router.get('/:userId', getUserPermission);

/**
 * @route   PUT /api/permissions/:userId
 * @desc    Update permissions for a user
 * @access  Private (Admin only)
 */
router.put('/:userId', updatePermission);

/**
 * @route   POST /api/permissions/:userId/reset
 * @desc    Reset permissions to default for a user
 * @access  Private (Admin only)
 */
router.post('/:userId/reset', resetPermission);

/**
 * @route   POST /api/permissions/bulk
 * @desc    Bulk update permissions for multiple users
 * @access  Private (Admin only)
 */
router.post('/bulk', bulkUpdatePermissions);

module.exports = router;
