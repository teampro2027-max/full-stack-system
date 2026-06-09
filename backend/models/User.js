const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    mfaSecret: { type: String },
    mfaEnabled: { type: Boolean, default: false },
    preferredLanguage: { type: String, enum: ['en', 'so'], default: 'en' },
    notificationsEnabled: { type: Boolean, default: true },
    fcmToken: { type: String },
    lastLogin: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
