const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createSupportMessage,
    getMySupportMessages,
    adminGetSupportMessages,
    adminReplySupportMessage
} = require('../controllers/supportController');

router.post('/', protect, createSupportMessage);
router.get('/', protect, getMySupportMessages);
router.get('/admin', protect, admin, adminGetSupportMessages);
router.post('/admin/reply/:id', protect, admin, adminReplySupportMessage);

module.exports = router;
