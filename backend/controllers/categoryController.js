const Category = require('../models/Category');

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, icon, color, active, parentId } = req.body;
        if (!name || !/^[a-zA-Z\s]+$/.test(name.trim())) {
            return res.status(400).json({ message: 'Category name can only contain letters and spaces' });
        }
        
        let key = name.trim().toLowerCase().replace(/\s+/g, '_');
        if (parentId) {
            const parent = await Category.findById(parentId);
            if (!parent) {
                return res.status(400).json({ message: 'Parent category not found' });
            }
            key = `${parent.key}_${key}`;
        }
        
        const exists = await Category.findOne({ key });
        if (exists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const categoryData = { name: name.trim(), key, icon, color, active, parentId: parentId || null };

        // Handle uploaded image
        if (req.file) {
            categoryData.image = `/uploads/${req.file.filename}`;
        }

        const category = await Category.create(categoryData);
        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { name, icon, color, active } = req.body;
        const updates = { name, icon, color, active };
        if (name) {
            if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
                return res.status(400).json({ message: 'Category name can only contain letters and spaces' });
            }
            updates.name = name.trim();
            
            const current = await Category.findById(req.params.id);
            if (current && current.parentId) {
                const parent = await Category.findById(current.parentId);
                if (parent) {
                    updates.key = `${parent.key}_${name.trim().toLowerCase().replace(/\s+/g, '_')}`;
                } else {
                    updates.key = name.trim().toLowerCase().replace(/\s+/g, '_');
                }
            } else {
                updates.key = name.trim().toLowerCase().replace(/\s+/g, '_');
            }
        }

        // Handle uploaded image
        if (req.file) {
            updates.image = `/uploads/${req.file.filename}`;
        }

        const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        
        await Category.deleteOne({ _id: req.params.id });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
