const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            console.warn('MONGODB_URI not set - falling back to JSON file storage');
            return null;
        }

        await mongoose.connect(mongoURI, {
            dbName: 'corazintel',
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        console.log('✅ MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
            isConnected = false;
        });

        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        console.warn('Falling back to JSON file storage');
        return null;
    }
}

function isMongoDBConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
    connectDB,
    isMongoDBConnected
};
