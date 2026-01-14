const jwt = require('jsonwebtoken');
const CyberCafe = require('../models/cyberCafe/cyberCafeSchema');

exports.AuthCyberCafe = async (req, res, next) => {
    try {
        let token;

        // Get token from cookies or Authorization header
        if (req.cookies && req.cookies.cyberCafeToken) {
            token = req.cookies.cyberCafeToken;
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

            // Check if this is a cyber cafe token
            if (decoded.type !== 'cyberCafe') {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token type. Please login again."
                });
            }

            // Find cyber cafe
            const cafe = await CyberCafe.findById(decoded.id);

            if (!cafe) {
                return res.status(401).json({
                    success: false,
                    message: "Cyber cafe not found. Please login again."
                });
            }

            if (!cafe.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Your account has been deactivated. Please contact administrator."
                });
            }

            // Check if account is locked
            if (cafe.isAccountLocked()) {
                const remainingTime = cafe.lockRemainingTime;
                return res.status(423).json({
                    success: false,
                    message: `Account locked. Try again in ${remainingTime} hours.`
                });
            }

            // Attach cyber cafe to request
            req.cyberCafe = cafe;
            next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token. Please login again."
            });
        }

    } catch (error) {
        console.error('Cyber cafe auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error in authentication"
        });
    }
};
