const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const isOffline = process.env.OFFLINE_MODE === 'true';

let adminInstance = admin;

try {
    if (isOffline) {
        console.log('Firebase Admin: Bypassing real initialization (OFFLINE mode is active)');
        adminInstance = {
            messaging: () => ({
                send: async (message) => {
                    console.log(`\n==================================================`);
                    console.log(`[Offline Push Notification Mock] Sent to token ${message.token}:`);
                    console.log(`Title: ${message.notification?.title}`);
                    console.log(`Body: ${message.notification?.body}`);
                    console.log(`Data:`, message.data);
                    console.log(`==================================================\n`);
                    return 'mock-message-id-' + Math.random().toString(36).substring(2, 9);
                },
                sendMulticast: async (message) => {
                    console.log(`\n==================================================`);
                    console.log(`[Offline Push Notification Mock] Broadcast to ${message.tokens?.length} tokens:`);
                    console.log(`Title: ${message.notification?.title}`);
                    console.log(`Body: ${message.notification?.body}`);
                    console.log(`Data:`, message.data);
                    console.log(`==================================================\n`);
                    return {
                        successCount: message.tokens?.length || 0,
                        failureCount: 0,
                        responses: (message.tokens || []).map(() => ({ success: true, messageId: 'mock-multicast-id' }))
                    };
                }
            })
        };
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
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
    if (isOffline) {
        console.log('Firebase Admin: Initialization skipped/failed silently because system is offline.');
    } else {
        console.error('Firebase Admin Initialization Error:', error.message);
    }
}

module.exports = adminInstance;
