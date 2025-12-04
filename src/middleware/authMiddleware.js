



// const jwt = require('jsonwebtoken');
// const User = require('../models/auth');

// exports.AuthUser = async (req, res, next) => {
//     try {
//         let token;

//         // Get token from cookies or Authorization header
//         if (req.cookies && req.cookies.token) {
//             token = req.cookies.token;
//         } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//             token = req.headers.authorization.split(' ')[1];
//         }

//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Access denied. No token provided. Please login."
//             });
//         }

//         try {
//             // Verify token
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
//             // Find user
//             const user = await User.findById(decoded.id);
            
//             if (!user) {
//                 return res.status(401).json({
//                     success: false,
//                     message: "User not found. Please login again."
//                 });
//             }

//             if (!user.isActive) {
//                 return res.status(401).json({
//                     success: false,
//                     message: "Your account has been deactivated. Please contact administrator."
//                 });
//             }

//             // Check if account is locked
//             if (user.isAccountLocked()) {
//                 const remainingTime = user.lockRemainingTime;
//                 return res.status(423).json({
//                     success: false,
//                     message: `Account locked. Try again in ${remainingTime} hours.`
//                 });
//             }

//             // Attach user to request
//             req.user = user;
//             next();

//         } catch (error) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid or expired token. Please login again."
//             });
//         }

//     } catch (error) {
//         console.error('Auth middleware error:', error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error in authentication"
//         });
//     }
// };

// // Role-based middleware
// exports.requireRole = (...roles) => {
//     return (req, res, next) => {
//         if (!req.user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Authentication required"
//             });
//         }

//         if (!roles.includes(req.user.role)) {
//             return res.status(403).json({
//                 success: false,
//                 message: `Access denied. Required role: ${roles.join(', ')}. Your role: ${req.user.role}`
//             });
//         }

//         next();
//     };
// };

// // Specific role middlewares
// exports.requireAdmin = exports.requireRole('admin');
// exports.requireAdminOrAssistant = exports.requireRole('admin', 'assistant');
// exports.requirePublisher = exports.requireRole('publisher');



const jwt = require('jsonwebtoken');
const User = require('../models/auth');

exports.AuthUser = async (req, res, next) => {
    try {
        let token;

        // Get token from cookies or Authorization header
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided. Please login."
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found. Please login again."
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Your account has been deactivated. Please contact administrator."
                });
            }

            // Check if account is locked
            if (user.isAccountLocked()) {
                const remainingTime = user.lockRemainingTime;
                return res.status(423).json({
                    success: false,
                    message: `Account locked. Try again in ${remainingTime} hours.`
                });
            }

            // Attach user to request as req.user (not req.accessUser)
            req.user = user;
            next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token. Please login again."
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error in authentication"
        });
    }
};

// Role-based middleware
exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(', ')}. Your role: ${req.user.role}`
            });
        }

        next();
    };
};

// Specific role middlewares
exports.requireAdmin = exports.requireRole('admin');
exports.requireAdminOrAssistant = exports.requireRole('admin', 'assistant');
exports.requirePublisher = exports.requireRole('publisher');