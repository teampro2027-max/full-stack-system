const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, getMyProfile, updateUserProfile } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, getMyProfile)
    .put(protect, updateUserProfile);

router.route('/')
    .get(protect, admin, getUsers);

router.route('/:id')
    .delete(protect, admin, deleteUser);

module.exports = router;
