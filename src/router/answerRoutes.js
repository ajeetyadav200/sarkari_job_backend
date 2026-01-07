const express = require('express');
const AnswerController = require('../controller/answerController/answerController');
const { AuthUser, requireRole } = require('../middleware/authMiddleware');
const { uploadDynamicFiles, uploadSingleFile } = require('../middleware/uploadMiddleware');

const router = express.Router();

// ========== PUBLIC ROUTES (No authentication required) ==========
router.get('/', AnswerController.getAllAnswers);
router.get('/list', AnswerController.getAllAnswersList);
router.get('/latest', AnswerController.getLatestAnswers);
router.get('/search', AnswerController.searchAnswers);
router.get('/:id', AnswerController.getAnswerById);

// ========== PROTECTED ROUTES (All authenticated users) ==========
router.get('/my/answers', AuthUser, AnswerController.getMyAnswers);

// ========== ROUTES FOR ASSISTANT, PUBLISHER, AND ADMIN ==========
// Create answer with file uploads
router.post(
  '/',
  AuthUser,
  requireRole('assistant', 'publisher', 'admin'),
  uploadDynamicFiles,
  AnswerController.createAnswer
);

// Update answer with file uploads
router.put(
  '/:id',
  AuthUser,
  requireRole('assistant', 'publisher', 'admin'),
  uploadDynamicFiles,
  AnswerController.updateAnswer
);

// Delete answer
router.delete(
  '/:id',
  AuthUser,
  requireRole('assistant', 'publisher', 'admin'),
  AnswerController.deleteAnswer
);

// Upload single file to existing answer
router.post(
  '/:id/upload',
  AuthUser,
  requireRole('assistant', 'publisher', 'admin'),
  uploadSingleFile('file'),
  AnswerController.uploadFileToAnswer
);

// Delete file from answer
router.delete(
  '/:id/files/:fileId',
  AuthUser,
  requireRole('assistant', 'publisher', 'admin'),
  AnswerController.deleteFileFromAnswer
);

// ========== ADMIN ONLY ROUTES ==========
// Change answer status
router.patch(
  '/:id/status',
  AuthUser,
  requireRole('admin'),
  AnswerController.changeAnswerStatus
);

// Get answer statistics
router.get(
  '/admin/stats',
  AuthUser,
  requireRole('admin'),
  AnswerController.getAnswerStats
);

module.exports = router;
