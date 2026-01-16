const express = require('express');
const {
    getAllCyberCafes,
    getCyberCafeById,
    verifyCyberCafe,
    unverifyCyberCafe,
    toggleActiveStatus,
    deleteCyberCafe,
    unlockAccount,
    getDashboardStats,
    bulkVerify,
    bulkDelete
} = require('../controller/cyberCafeController/adminCyberCafeController');
const { AuthUser, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require admin authentication
router.use(AuthUser, requireAdmin);

// Dashboard stats
router.get('/dashboard-stats', getDashboardStats);

// Get all cyber cafes with search, filter, pagination
router.get('/', getAllCyberCafes);

// Get single cyber cafe
router.get('/:id', getCyberCafeById);

// Verify cyber cafe
router.patch('/:id/verify', verifyCyberCafe);

// Unverify cyber cafe
router.patch('/:id/unverify', unverifyCyberCafe);

// Toggle active status
router.patch('/:id/toggle-active', toggleActiveStatus);

// Unlock account
router.patch('/:id/unlock', unlockAccount);

// Delete cyber cafe
router.delete('/:id', deleteCyberCafe);

// Bulk operations
router.post('/bulk-verify', bulkVerify);
router.post('/bulk-delete', bulkDelete);

module.exports = router;
