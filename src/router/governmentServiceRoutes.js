const express = require('express');
const {
  createGovernmentService,
  getAllGovernmentServices,
  getGovernmentServiceById,
  updateGovernmentService,
  deleteGovernmentService,
  updateStatus,
  getPublicGovernmentServices,
  getGovernmentServicesList,
  getServicesByType,
  getStatistics,
  getServiceTypes,
  incrementApplyClick
} = require('../controller/governmentServiceController/governmentServiceController.js');
const { AuthUser, requireRole } = require('../middleware/authMiddleware.js');

const router = express.Router();

/**
 * Government Service Routes
 *
 * Handles all government services including:
 * - Scholarships (UP Scholarship, PM Scholarship, etc.)
 * - Certificates (PAN Card, Income, Caste, Domicile)
 * - Registrations (Aadhaar, Voter ID, Passport)
 * - Verifications (Document verification services)
 * - Welfare Schemes (Pension, Health, Housing)
 *
 * File Upload Pattern:
 * 1. Upload files via POST /api/upload/single (returns fileUrl, cloudinaryId)
 * 2. Submit form with file URLs as JSON to these routes
 */

// ==================== PUBLIC ROUTES ====================

// Get available service types and categories (for dropdowns)
router.get('/types', getServiceTypes);

// Get public services (verified and active only)
router.get('/public', getPublicGovernmentServices);

// Get services list with infinite scrolling
router.get('/list', getGovernmentServicesList);

// Get services by type (scholarship, certificate, etc.)
router.get('/by-type/:serviceType', getServicesByType);

// Get single service by ID or slug (public)
router.get('/:id', getGovernmentServiceById);

// Record apply button click (analytics)
router.post('/:id/apply-click', incrementApplyClick);

// ==================== PROTECTED ROUTES ====================

// All routes below require authentication
router.use(AuthUser);

// Get statistics (admin/assistant/publisher)
router.get('/admin/statistics', requireRole('admin', 'assistant', 'publisher'), getStatistics);

// Get all services with filters (role-based access)
router.get('/', getAllGovernmentServices);

// Create service (publisher, assistant, admin)
router.post('/', requireRole('publisher', 'assistant', 'admin'), createGovernmentService);

// Update service (creator or admin)
router.put('/:id', updateGovernmentService);

// Update status (admin only)
router.patch('/:id/status', requireRole('admin'), updateStatus);

// Delete service (creator or admin)
router.delete('/:id', deleteGovernmentService);

module.exports = router;
