const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Help Request'
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['support', 'help', 'chat'],
        default: 'support'
    },
    status: {
        type: String,
        enum: ['pending', 'resolved'],
        default: 'pending'
    },
    reply: {
        type: String
    },
    replyDate: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
