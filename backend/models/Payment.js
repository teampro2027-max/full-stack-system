const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    billId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['EVC', 'WaafiPay'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    transactionId: {
        type: String
    },
    referenceId: {
        type: String,
        unique: true,
        sparse: true
    },
    invoiceId: {
        type: String,
        unique: true,
        sparse: true
    },
    requestId: {
        type: String,
        unique: true,
        sparse: true
    },
    responseCode: {
        type: String
    },
    errorCode: {
        type: String
    },
    description: {
        type: String
    },
    provider: {
        type: String,
        default: 'internal'
    },
    providerResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    paidDate: {
        type: Date,
        default: Date.now
    },
    phoneNumber: {
        type: String
    },
    receiverPhone: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
