// router/admissionRoutes.js
const express = require('express');
const {
  createAdmission,
  getAllAdmissions,
  getAdmissionById,
  updateAdmission,
  deleteAdmission,
  changeAdmissionStatus,
  getMyAdmissions,
  getAdmissionStats,
  getOpenAdmissions,
  searchAdmissions,
  getAllAdmissionsList,
  getLatestAdmissions
} = require('../controller/admissionController/admissionController');
const { AuthUser, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', getAllAdmissions);
router.get('/list', getAllAdmissionsList);
router.get('/latest', getLatestAdmissions);
router.get('/search', searchAdmissions);
router.get('/open', getOpenAdmissions);

// Protected routes (authenticated users)
router.use(AuthUser);

// Get statistics (admin only) - MUST be before /:id route
router.get('/admin/stats', requireRole('admin'), getAdmissionStats);

// Get my admissions - MUST be before /:id route
router.get('/my/admissions', getMyAdmissions);

// Create admission (publisher, assistant, admin)
router.post('/', requireRole('publisher', 'assistant', 'admin'), createAdmission);

// Get all admissions with filters (role-based access)
router.get('/', getAllAdmissions);

// Update status (admin only) - MUST be before /:id route
router.patch('/:id/status', requireRole('admin'), changeAdmissionStatus);

// Update admission (creator or admin)
router.put('/:id', updateAdmission);

// Delete admission (creator or admin)
router.delete('/:id', deleteAdmission);

// Get admission by ID - MUST be LAST among GET routes with /:id pattern
router.get('/:id', getAdmissionById);

module.exports = router;
