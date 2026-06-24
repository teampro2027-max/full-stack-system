const mongoose = require('mongoose');

const connectDB = async () => {
    const atlasUri = process.env.MONGODB_URI;

    if (!atlasUri) {
        console.error('Database Connection Error: MONGODB_URI is missing. Add your MongoDB Atlas URI to backend/.env.');
        process.exit(1);
    }

    try {
        const cleanUri = atlasUri.includes('@') ? atlasUri.split('@').pop() : atlasUri;
        console.log('Database Connection: Using MongoDB Atlas.');
        console.log(`Attempting database connection to: ${cleanUri}`);
        const conn = await mongoose.connect(atlasUri, {
            serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 15000),
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Connection Error: Could not connect to MongoDB Atlas (${error.message}).`);
        console.error('Check your internet connection, Atlas Network Access IP whitelist, username/password, and database name.');
        process.exit(1);
    }
};

module.exports = connectDB;
