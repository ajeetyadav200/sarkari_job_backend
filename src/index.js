
// const express = require("express");
// const app = express();
// require('dotenv').config();
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// const { connection_database } = require('./config/database');

// // Import routes
// const authRoutes = require('./router/route');
// const jobRoutes = require('./router/jobRoutes');
// const admitCardRoutes = require('./router/admitCardRoutes');
// const resultRoutes = require('./router/resultRoutes');

// // PORT
// const PORT = process.env.PORT || 5173;

// // CORS CONFIG
// const corsOptions = {
//     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//     credentials: true,
//     optionsSuccessStatus: 200
// };



// // 1. CORS first
// app.use(cors(corsOptions));

// // 2. Body parsing middleware SECOND
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));


// // 3. Cookie parser THIRD
// app.use(cookieParser());

// // 4. Security headers FOURTH
// app.use((req, res, next) => {
//     res.setHeader('X-Content-Type-Options', 'nosniff');
//     res.setHeader('X-Frame-Options', 'DENY');
//     res.setHeader('X-XSS-Protection', '1; mode=block');
//     res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
//     res.removeHeader('X-Powered-By');
//     next();
// });

// // 5. Routes LAST
// app.use('/api/auth', authRoutes);
// app.use('/api/jobs', jobRoutes);
// app.use('/api/admit-cards', admitCardRoutes);
// app.use('/api/results', resultRoutes);


// // Health check route (add this back)
// app.get('/health', (req, res) => {
//     res.status(200).json({
//         success: true,
//         message: 'Server is healthy and running',
//         timestamp: new Date().toISOString(),
//         environment: process.env.NODE_ENV || 'development'
//     });
// });

// // Root route
// app.get('/', (req, res) => {
//     res.json({
//         success: true,
//         message: 'Namaste everyone! Your backend is running successfully 🚀',
//         version: '1.0.0',
//         health: '/health'
//     });
// });

// // 404 Handler
// app.use((req, res) => {
//     res.status(404).json({
//         success: false,
//         message: `Route ${req.originalUrl} not found`
//     });
// });

// // Global Error Handler
// app.use((err, req, res, next) => {
//     console.error('Global Error Handler:', err);

//     if (err.name === 'ValidationError') {
//         const errors = Object.values(err.errors).map(e => e.message);
//         return res.status(400).json({ 
//             success: false, 
//             message: 'Validation Error', 
//             errors 
//         });
//     }

//     if (err.code === 11000) {
//         const field = Object.keys(err.keyValue)[0];
//         return res.status(400).json({ 
//             success: false, 
//             message: `${field} already exists` 
//         });
//     }

//     if (err.name === 'JsonWebTokenError') {
//         return res.status(401).json({
//             success: false,
//             message: 'Invalid token'
//         });
//     }

//     if (err.name === 'TokenExpiredError') {
//         return res.status(401).json({
//             success: false,
//             message: 'Token expired'
//         });
//     }

//     const statusCode = err.statusCode || 500;
//     res.status(statusCode).json({
//         success: false,
//         message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
//     });
// });

// // Connect DB & start server
// connection_database()
//     .then(() => {
//         console.log("✅ Database connected successfully");

//         app.listen(PORT, () => {
//             console.log(`🚀 Server running: http://localhost:${PORT}`);
//             console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
//             console.log(`❤️  Health check: http://localhost:${PORT}/health`);
            
           
//         });
//     })
//     .catch(err => {
//         console.error("❌ DB connection failed:", err.message);
//         process.exit(1);
//     });

// // Graceful shutdown
// process.on('SIGINT', () => {
//     console.log("\n👋 Received SIGINT. Shutting down gracefully...");
//     process.exit(0);
// });

// process.on('SIGTERM', () => {
//     console.log("\n👋 Received SIGTERM. Shutting down gracefully...");
//     process.exit(0);
// });

// process.on('unhandledRejection', (err, promise) => {
//     console.log('❌ Unhandled Promise Rejection:', err.message);
//     process.exit(1);
// });

// process.on('uncaughtException', (err) => {
//     console.log('❌ Uncaught Exception:', err.message);
//     process.exit(1);
// });

// module.exports = app;/



const express = require("express");
const app = express();
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connection_database } = require('./config/database');

// Import routes
const authRoutes = require('./router/route');
const jobRoutes = require('./router/jobRoutes');
const admitCardRoutes = require('./router/admitCardRoutes');
const resultRoutes = require('./router/resultRoutes');

// PORT
const PORT = process.env.PORT || 7777;

// Determine allowed origins based on environment
const allowedOrigins = [];

// Add production frontend URL
if (process.env.FRONTEND_URL_PRODUCTION) {
    allowedOrigins.push(process.env.FRONTEND_URL_PRODUCTION);
}

// Add development frontend URL if in development
if (process.env.NODE_ENV !== 'production' && process.env.FRONTEND_URL_DEVELOPMENT) {
    allowedOrigins.push(process.env.FRONTEND_URL_DEVELOPMENT);
}

// Add the backend URL itself
if (process.env.BACKEND_URL_PRODUCTION) {
    allowedOrigins.push(process.env.BACKEND_URL_PRODUCTION);
}

// CORS CONFIG - Dynamic origin checking
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// 1. CORS first
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// 2. Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Cookie parser
app.use(cookieParser());

// 4. Security headers
app.use((req, res, next) => {
    // Set CORS headers
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.removeHeader('X-Powered-By');
    
    next();
});

// Logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('User-Agent:', req.headers['user-agent']);
    next();
});

// 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admit-cards', admitCardRoutes);
app.use('/api/results', resultRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy and running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: {
            allowedOrigins: allowedOrigins,
            currentOrigin: req.headers.origin
        }
    });
});

// Test CORS route
app.get('/api/test-cors', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CORS test successful',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Namaste everyone! Your backend is running successfully 🚀',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            testCors: '/api/test-cors',
            auth: '/api/auth',
            jobs: '/api/jobs',
            admitCards: '/api/admit-cards',
            results: '/api/results'
        },
        cors: {
            allowedOrigins: allowedOrigins
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);

    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS Error: Origin not allowed',
            allowedOrigins: allowedOrigins,
            yourOrigin: req.headers.origin
        });
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ 
            success: false, 
            message: 'Validation Error', 
            errors 
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({ 
            success: false, 
            message: `${field} already exists` 
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Connect DB & start server
connection_database()
    .then(() => {
        console.log("✅ Database connected successfully");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port: ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌍 Allowed CORS origins:`, allowedOrigins);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 Test CORS: http://localhost:${PORT}/api/test-cors`);
        });
    })
    .catch(err => {
        console.error("❌ DB connection failed:", err.message);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log("\n👋 Received SIGINT. Shutting down gracefully...");
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log("\n👋 Received SIGTERM. Shutting down gracefully...");
    process.exit(0);
});

process.on('unhandledRejection', (err, promise) => {
    console.log('❌ Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.log('❌ Uncaught Exception:', err.message);
    process.exit(1);
});

module.exports = app;