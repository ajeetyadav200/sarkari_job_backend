// router/jobRoutes.js
const express = require("express");
const JobController = require('../controller/jobcontroller/jobController');
const { AuthUser, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (No authentication required)
router.get('/', JobController.getAllJobs);
router.get('/list', JobController.getAllJobsList);
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