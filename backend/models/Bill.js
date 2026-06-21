const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const billSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: [
            'electricity',
            'water',
            'internet',
            'rent',
            'school_fees',
            'mobile_postpaid',
            'tv_subscription',
            'waste_collection',
            'loan_installment',
            'government_license'
        ],
        required: true
    },
    status: {
        type: String,
        enum: ['paid', 'unpaid', 'overdue'],
        default: 'unpaid'
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringInterval: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    notes: {
        type: String
    },
    receiptUrl: {
        type: String
    },
    documentUrl: {
        type: String
    },
    lastPaidDate: {
        type: Date
    },
    language: {
        type: String,
        enum: ['en', 'so'],
        default: 'en'
    }
}, { timestamps: true });

// Encryption Middleware
billSchema.pre('save', async function() {
    if (this.isModified('title')) this.title = encrypt(this.title);
    if (this.isModified('notes')) this.notes = encrypt(this.notes);
});

// Decryption Middleware
const decryptFields = (doc) => {
    if (!doc) return;
    if (doc.title) doc.title = decrypt(doc.title);
    if (doc.notes) doc.notes = decrypt(doc.notes);
};

billSchema.post('init', decryptFields);
billSchema.post('save', decryptFields);

module.exports = mongoose.model('Bill', billSchema);

