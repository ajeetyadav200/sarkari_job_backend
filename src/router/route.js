
const express = require('express');
const {
    adminSignup,
    login,
    verifyOTP,
    resendOTP,
    createUser,
    getMe,
    logout,
    updateProfile,
    unlockUserAccount,
    unlockIPAddress
} = require('../controller/authController');
const { AuthUser, requireAdmin , requireRole} = require('../middleware/authMiddleware');



const router = express.Router();

// Public routes
router.post('/admin/signup', adminSignup);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Protected routes
router.post('/logout', AuthUser, logout);
router.get('/me', AuthUser, getMe);
router.put('/update-profile', AuthUser, updateProfile);

// Admin only routes
router.post('/create-user', AuthUser, requireAdmin, createUser);
router.post('/unlock-account/:userId', AuthUser, requireAdmin, unlockUserAccount);
router.post('/unlock-ip/:ipAddress', AuthUser, requireAdmin, unlockIPAddress);


// all assistance router

const {
    createAssistant,
    updateAssistant,
    deleteAssistant,
    getAllAssistants,
    getAssistant
} = require('../controller/adminController/assistance');

// Assistant management routes (Admin only)
router.post('/assistants', AuthUser, requireAdmin, createAssistant);
router.get('/assistants', AuthUser, requireAdmin, getAllAssistants);
router.get('/assistants/:id', AuthUser, requireAdmin, getAssistant);
router.patch('/assistants/:id', AuthUser, requireAdmin, updateAssistant);
router.delete('/assistants/:id', AuthUser, requireAdmin, deleteAssistant);


// Publisher management routes (Admin only)

const {
    createPublisher,
    updatePublisher,
    deletePublisher,
    getAllPublishers,
    getPublisher,
    logoutPublisher
} = require('../controller/adminController/publicer');

router.post('/publishers', AuthUser, requireAdmin, createPublisher);
router.get('/publishers', AuthUser, requireAdmin, getAllPublishers);
router.get('/publishers/:id', AuthUser, requireAdmin, getPublisher);
router.patch('/publishers/:id', AuthUser, requireAdmin, updatePublisher);
router.delete('/publishers/:id', AuthUser, requireAdmin, deletePublisher);
router.post('/publishers/:id/logout', AuthUser, requireAdmin, logoutPublisher);





module.exports = router;