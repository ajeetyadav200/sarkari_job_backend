
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

// CORS CONFIG
const allowedOrigins = [
    'https://naukaristore.org',
     'https://naukaristore.com',
    'https://www.naukaristore.org',
    process.env.FRONTEND_URL_PRODUCTION,
     process.env.FRONTEND_URL_PRODUCTION2,
    process.env.FRONTEND_URL_DEVELOPMENT,
    'http://localhost:5173'
].filter(Boolean); // Remove undefined values

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // ('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};



// 1. CORS first
app.use(cors(corsOptions));

// 2. Body parsing middleware SECOND
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 3. Cookie parser THIRD
app.use(cookieParser());

// 4. Security headers FOURTH
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.removeHeader('X-Powered-By');
    next();
});

// 5. Routes LAST
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admit-cards', admitCardRoutes);
app.use('/api/results', resultRoutes);


// Health check route (add this back)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy and running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Namaste everyone! Your backend is running successfully 🚀',
        version: '1.0.0',
        health: '/health'
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
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
});

// Connect DB & start server
if (require.main === module) {
    connection_database()
        .then(() => {
            ("✅ Database connected successfully");

            app.listen(PORT, () => {
                (`🚀 Server running: http://localhost:${PORT}`);
                (`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
                (`❤️  Health check: http://localhost:${PORT}/health`);
            });
        })
        .catch(err => {
            console.error("❌ DB connection failed:", err.message);
            process.exit(1);
        });
}

// Graceful shutdown
process.on('SIGINT', () => {
    ("\n👋 Received SIGINT. Shutting down gracefully...");
    process.exit(0);
});

process.on('SIGTERM', () => {
    ("\n👋 Received SIGTERM. Shutting down gracefully...");
    process.exit(0);
});

process.on('unhandledRejection', (err, promise) => {
    ('❌ Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    ('❌ Uncaught Exception:', err.message);
    process.exit(1);
});

module.exports = app;