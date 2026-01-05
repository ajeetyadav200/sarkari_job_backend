const express = require('express');
const {
  createResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
  updateStatus,
  getResultsByJobId,
  getPublicResults,
  getAvailableReferences,
  getAllResultsList
} = require('../controller/resultController/result.js');
const { AuthUser, requireRole } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.get('/public', getPublicResults);
router.get('/list', getAllResultsList);
router.get('/job/:jobId', getResultsByJobId);
router.get('/:id', getResultById);

// Protected routes (authenticated users)
router.use(AuthUser);

// Get available references for result creation
router.get('/references/available', getAvailableReferences);

// Create result (publisher, assistant, admin)
router.post('/', requireRole('publisher', 'assistant', 'admin'), createResult);

// Get all results with filters (role-based access)
router.get('/', getAllResults);

// Update result (creator or admin)
router.put('/:id', updateResult);

// Update status (admin only)
router.patch('/:id/status', requireRole('admin'), updateStatus);

// Delete result (creator or admin)
router.delete('/:id', deleteResult);

module.exports = router;
