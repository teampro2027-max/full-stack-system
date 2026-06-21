const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully from env variable');
    } else {
        const keyPath = path.join(__dirname, 'serviceAccountKey.json');
        if (fs.existsSync(keyPath)) {
            const serviceAccount = require(keyPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin initialized successfully from local file');
        } else {
            console.warn('Firebase Admin Warning: No serviceAccountKey.json found or FIREBASE_SERVICE_ACCOUNT env variable set. Push notifications may not work.');
        }
    }
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error.message);
}

module.exports = admin;
