const Bill = require('../models/Bill');
const Notification = require('../models/Notification');

const getBills = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }
        const bills = await Bill.find(query).populate('userId', 'name email');
        res.json(bills);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createBill = async (req, res) => {
    const { title, amount, dueDate, category } = req.body;
    
    // Admins could pass userId, but typical user creates for themselves
    // Here we'll default to req.user._id if not provided, or let admin specify
    const targetUserId = (req.user.role === 'admin' && req.body.userId) ? req.body.userId : req.user._id;

    try {
        const bill = await Bill.create({
            userId: targetUserId,
            title,
            amount,
            dueDate,
            category
        });

        // Create notification for the user
        await Notification.create({
            userId: targetUserId,
            message: `A new ${category} bill "${title}" for $${amount} has been issued.`
        });

        res.status(201).json(bill);
    } catch (error) {
        console.error('CREATE BILL ERROR:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const updateBill = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Check ownership unless admin
        if (bill.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to update this bill' });
        }

        const updatedBill = await Bill.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedBill);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteBill = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Check ownership unless admin
        if (bill.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to delete this bill' });
        }

        await Bill.deleteOne({ _id: req.params.id });

        res.json({ message: 'Bill removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getBills,
    createBill,
    updateBill,
    deleteBill
};
