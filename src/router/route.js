
const express = require('express');
const {
    adminSignup,
    login,
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



// job session is here



const JobController = require('../controller/jobcontroller/jobController');












// Public routes (No authentication required)
router.get('/', JobController.getAllJobs);
router.get('/search', JobController.searchJobs);
router.get('/open', JobController.getOpenJobs);
router.get('/:id', JobController.getJobById);

// Protected routes for all authenticated users
router.get('/my/jobs', AuthUser, JobController.getMyJobs);

// Routes for Assistant and Publisher roles
router.post('/', AuthUser, requireRole('assistant', 'publisher', 'admin'), JobController.createJob);
router.put('/:id', AuthUser, requireRole('assistant', 'publisher', 'admin'), JobController.updateJob);
router.delete('/:id', AuthUser, requireRole('assistant', 'publisher', 'admin'), JobController.deleteJob);

// Admin only routes
router.patch('/:id/status', AuthUser, requireRole('admin'), JobController.changeJobStatus);
router.get('/admin/stats', AuthUser, requireRole('admin'), JobController.getJobStats);


module.exports = router;