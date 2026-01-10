const mongoose = require('mongoose');

// Disable buffering - fail fast instead of buffering operations
mongoose.set('bufferCommands', false);

// Increase buffer timeout as a safety net (60 seconds)
mongoose.set('bufferTimeoutMS', 60000);

exports.connection_database = async () => {
    try {
        // Validate DATABASE_URL exists
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        await mongoose.connect(process.env.DATABASE_URL, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10,
            minPoolSize: 2,
            retryWrites: true,
            retryReads: true
        });

        // Monitor connection health (errors only in development)
        mongoose.connection.on('error', (err) => {
            if (process.env.NODE_ENV !== 'production') {
                console.error('❌ MongoDB error:', err.message);
            }
        });

        mongoose.connection.on('disconnected', () => {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('⚠️  MongoDB disconnected');
            }
        });

        mongoose.connection.on('reconnected', () => {
            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ MongoDB reconnected');
            }
        });

    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1); // STOP SERVER
    }
};
