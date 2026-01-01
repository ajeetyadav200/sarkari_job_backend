const mongoose = require('mongoose')

const mongoose_url = process.env.DATABASE_URL

exports.connection_database = async () => {
    try {
        // Add connection options with proper timeout and settings
        await mongoose.connect(mongoose_url, {
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4
            maxPoolSize: 10,
            minPoolSize: 2
        });

        console.log("✅ MongoDB connected successfully");
        console.log("📍 Connected to:", mongoose.connection.name);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        return true;
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        console.error("Connection string:", mongoose_url?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password
        throw error;
    }
}

