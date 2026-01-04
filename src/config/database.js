const mongoose = require('mongoose');

// Disable buffering - fail fast instead of buffering operations
mongoose.set('bufferCommands', false);
console.log(process.env.DATABASE_URL)
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

        console.log("✅ MongoDB connected:", mongoose.connection.name);
        console.log("🔗 Connection state:", mongoose.connection.readyState);

        // Monitor connection health
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        console.error("Full error:", err);
        process.exit(1); // STOP SERVER
    }
};
