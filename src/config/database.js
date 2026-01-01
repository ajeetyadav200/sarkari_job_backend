const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

exports.connection_database = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
        });

        console.log("✅ MongoDB connected:", mongoose.connection.name);
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1); // STOP SERVER
    }
};
