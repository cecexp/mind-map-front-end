const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Si no hay MONGODB_URI, usar almacenamiento en memoria
        if (!process.env.MONGODB_URI) {
            console.log('⚠️  No MongoDB URI found, using in-memory storage for development');
            return;
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('⚠️  Server will continue running with in-memory storage for development');
        // Don't exit the process in development, use fallback storage
        // process.exit(1);
    }
};

module.exports = connectDB;