const admin = require('firebase-admin');
const path = require('path');

try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error.message);
    console.error('IMPORTANT: Please place your serviceAccountKey.json in the backend/config directory.');
}

module.exports = admin;
