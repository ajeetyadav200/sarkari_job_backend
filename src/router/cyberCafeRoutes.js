const express = require('express');
const {
    signup,
    login,
    getMe,
    logout,
    updateProfile
} = require('../controller/cyberCafeController/cyberCafeController');
const { AuthCyberCafe } = require('../middleware/cyberCafeMiddleware');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (requires cyber cafe authentication)
router.get('/me', AuthCyberCafe, getMe);
router.post('/logout', AuthCyberCafe, logout);
router.put('/update-profile', AuthCyberCafe, updateProfile);

module.exports = router;
