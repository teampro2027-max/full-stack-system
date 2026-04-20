const express = require('express');
const router = express.Router();
const { getBills, createBill, updateBill, deleteBill } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');
const path = require('path');

router.route('/')
    .get(protect, getBills)
    .post(protect, upload.single('document'), createBill);

router.route('/:id')
    .put(protect, upload.single('document'), updateBill)
    .delete(protect, deleteBill);

// Voice bill entry - receives transcript text and creates bill
router.post('/voice', protect, async (req, res) => {
    // In production, use a speech-to-text service (Google Cloud Speech, etc.)
    // Here we accept pre-transcribed text and parse it into bill fields
    const { transcript, userId } = req.body;

    const categoryMap = {
        electricity: 'electricity', electric: 'electricity',
        water: 'water',
        internet: 'internet', wifi: 'internet',
        rent: 'rent',
        school: 'school_fees', fees: 'school_fees',
        mobile: 'mobile_postpaid', postpaid: 'mobile_postpaid', phone: 'mobile_postpaid',
        tv: 'tv_subscription', television: 'tv_subscription',
        waste: 'waste_collection', garbage: 'waste_collection',
        loan: 'loan_installment', installment: 'loan_installment',
        government: 'government_license', license: 'government_license'
    };

    let detectedCategory = 'electricity';
    const lowerTranscript = transcript.toLowerCase();
    for (const [keyword, cat] of Object.entries(categoryMap)) {
        if (lowerTranscript.includes(keyword)) {
            detectedCategory = cat;
            break;
        }
    }

    const amountMatch = lowerTranscript.match(/(\d+(\.\d{1,2})?)/);
    const detectedAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    res.json({
        suggestedBill: {
            title: `${detectedCategory.replace(/_/g, ' ')} Bill (Voice Entry)`,
            amount: detectedAmount,
            category: detectedCategory,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        transcript,
        message: 'Review and confirm the bill details before saving'
    });
});

module.exports = router;
