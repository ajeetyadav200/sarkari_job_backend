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

// Public routes
router.get('/public', getAllAdmissions);
router.get('/list', getAllAdmissionsList);
router.get('/latest', getLatestAdmissions);
router.get('/search', searchAdmissions);
router.get('/open', getOpenAdmissions);
router.get('/:id', getAdmissionById);

// Protected routes (authenticated users)
router.use(AuthUser);

// Create admission (publisher, assistant, admin)
router.post('/', requireRole('publisher', 'assistant', 'admin'), createAdmission);

// Get all admissions with filters (role-based access)
router.get('/', getAllAdmissions);

// Get my admissions
router.get('/my/admissions', getMyAdmissions);

// Update admission (creator or admin)
router.put('/:id', updateAdmission);

// Update status (admin only)
router.patch('/:id/status', requireRole('admin'), changeAdmissionStatus);

// Get statistics (admin only)
router.get('/admin/stats', requireRole('admin'), getAdmissionStats);

// Delete admission (creator or admin)
router.delete('/:id', deleteAdmission);

module.exports = router;
