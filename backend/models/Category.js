const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    icon: { type: String, default: '📋' },
    color: { type: String, default: 'bg-indigo-100 text-indigo-700' },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
