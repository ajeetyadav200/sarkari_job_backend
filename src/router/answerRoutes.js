const express = require('express');
const {
  createAnswer,
  getAllAnswers,
  getAnswerById,
  updateAnswer,
  deleteAnswer,
  updateStatus,
  getAnswersByJobId,
  getPublicAnswers,
  getAvailableReferences,
  getAllAnswersList
} = require('../controller/answerController/answerController.js');
const { AuthUser, requireRole } = require('../middleware/authMiddleware.js');

const router = express.Router();

/**
 * Answer Routes - Now uses JSON for file data
 *
 * File Upload Pattern:
 * 1. Upload files via POST /api/upload/single (returns fileUrl, cloudinaryId)
 * 2. Submit form with file URLs as JSON to these routes
 */

// Public routes
router.get('/public', getPublicAnswers);
router.get('/list', getAllAnswersList);
router.get('/job/:jobId', getAnswersByJobId);
router.get('/:id', getAnswerById);

// Protected routes (authenticated users)
router.use(AuthUser);

// Get available references for answer creation
router.get('/references/available', getAvailableReferences);

// Create answer (publisher, assistant, admin) - accepts JSON with file URLs
router.post('/', requireRole('publisher', 'assistant', 'admin'), createAnswer);

// Get all answers with filters (role-based access)
router.get('/', getAllAnswers);

// Update answer (creator or admin) - accepts JSON with file URLs
router.put('/:id', updateAnswer);

// Update status (admin only)
router.patch('/:id/status', requireRole('admin'), updateStatus);

// Delete answer (creator or admin)
router.delete('/:id', deleteAnswer);

module.exports = router;
