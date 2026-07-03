const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

router.route('/')
    .get(getCategories)
    .post(protect, admin, upload.single('image'), createCategory);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateCategory)
    .delete(protect, admin, deleteCategory);

module.exports = router;
