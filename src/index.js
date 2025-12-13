
const express = require("express");
const app = express();
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connection_database } = require('./config/database');

// Import routes
const authRoutes = require('./router/route');
const jobRoutes = require('./router/jobRoutes');
const admitCardRoutes = require('./router/admitCardRoutes')

// PORT
const PORT = process.env.PORT || 5173;

// CORS CONFIG
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
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
connection_database()
    .then(() => {
        console.log("✅ Database connected successfully");

        app.listen(PORT, () => {
            console.log(`🚀 Server running: http://localhost:${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`❤️  Health check: http://localhost:${PORT}/health`);
            
           
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