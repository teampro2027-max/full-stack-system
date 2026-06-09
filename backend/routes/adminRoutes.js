const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    adminGetUsers, adminCreateUser, adminUpdateUser, adminDeleteUser,
    adminGetBills, adminCreateBill, adminUpdateBill, adminDeleteBill,
    adminGetPayments, adminConfirmPayment, adminRejectPayment,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require authentication + admin role
router.use(protect, admin);

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.route('/users')
    .get(adminGetUsers)
    .post(adminCreateUser);
router.route('/users/:id')
    .put(adminUpdateUser)
    .delete(adminDeleteUser);

// Bills
router.route('/bills')
    .get(adminGetBills)
    .post(adminCreateBill);
router.route('/bills/:id')
    .put(adminUpdateBill)
    .delete(adminDeleteBill);

// Payments
router.get('/payments', adminGetPayments);
router.put('/payments/:id/confirm', adminConfirmPayment);
router.put('/payments/:id/reject', adminRejectPayment);

module.exports = router;
