


// routes/admitCardRoutes.js
const express = require('express');
const {
  createAdmitCard,
  getAllAdmitCards,
  getAdmitCardById,
  updateAdmitCard,
  deleteAdmitCard,
  updateStatus,
  getAdmitCardsByJobId,
  getPublicAdmitCards,
  getAvailableReferences,
  getAllAdmitCardsList
} = require('../controller/admitCardController/admitCard.js');
const { AuthUser, requireRole } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.get('/public', getPublicAdmitCards);
router.get('/list', getAllAdmitCardsList);
router.get('/job/:jobId', getAdmitCardsByJobId);
router.get('/:id', getAdmitCardById);

// Protected routes (authenticated users)
router.use(AuthUser);

// Get available references for admit card creation
router.get('/references/available', getAvailableReferences);

// Create admit card (publisher, assistant, admin)
router.post('/', requireRole('publisher', 'assistant', 'admin'), createAdmitCard);

// Get all admit cards with filters (role-based access)
router.get('/', getAllAdmitCards);

// Update admit card (creator or admin)
router.put('/:id', updateAdmitCard);

// Update status (admin only)
router.patch('/:id/status', requireRole('admin'), updateStatus);

// Delete admit card (creator or admin)
router.delete('/:id', deleteAdmitCard);

module.exports = router;