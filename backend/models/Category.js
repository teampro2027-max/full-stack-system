const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    icon: { type: String, default: '📋' },
    image: { type: String, default: null },
    color: { type: String, default: 'bg-indigo-100 text-indigo-700' },
    active: { type: Boolean, default: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
