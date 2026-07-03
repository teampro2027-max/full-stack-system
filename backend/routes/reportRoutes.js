const express = require('express');
const router = express.Router();
const { monthlyReport, categoryReport, exportPDF, getAuditLogs, getPhoneReport, exportPhonePDF, getUsersActivityReport } = require('../controllers/reportsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/monthly', protect, monthlyReport);
router.get('/category', protect, categoryReport);
router.get('/export-pdf', protect, exportPDF);
router.get('/audit', protect, admin, getAuditLogs);
router.get('/phone/:number', protect, getPhoneReport);
router.get('/phone/:number/export', protect, exportPhonePDF);
router.get('/users-activity', protect, admin, getUsersActivityReport);

module.exports = router;
