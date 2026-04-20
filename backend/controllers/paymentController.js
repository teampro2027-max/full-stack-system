const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { generateReceiptPDF } = require('../utils/pdfGenerator');
const Stripe = require('stripe');
const {
    normalizePhoneNumber,
    isValidWaafiPhoneNumber,
    generateRequestId,
    generateReferenceId,
    generateInvoiceId,
    buildWaafiPurchasePayload,
    sendWaafiRequest,
    isWaafiSuccessResponse
} = require('../utils/waafiPay');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentWithUniqueIds = async (paymentData) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await Payment.create({
                ...paymentData,
                requestId: generateRequestId(),
                referenceId: generateReferenceId(),
                invoiceId: generateInvoiceId()
            });
        } catch (error) {
            if (error?.code !== 11000) {
                throw error;
            }
        }
    }

    throw new Error('Unable to generate a unique payment reference. Please try again.');
};

const processWaafiPayment = async (req, res) => {
    const { billId, amount, description, receiverPhone } = req.body;

    try {
        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        if (
            bill.userId.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(401).json({ message: 'Not authorized to pay this bill' });
        }

        const normalizedPhone = normalizePhoneNumber(req.user.phone);
        if (!normalizedPhone) {
            return res.status(400).json({
                message: 'This account has no registered phone number'
            });
        }

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        // Create a pending payment record with unique IDs
        const payment = await createPaymentWithUniqueIds({
            billId,
            userId: req.user._id,
            amount: Number(numericAmount.toFixed(2)),
            method: 'WaafiPay',
            provider: 'WaafiPay',
            status: 'pending',
            phoneNumber: normalizedPhone,
            description: description || `Payment for ${bill.title || 'bill'}`
        });

        // Building the REAL WaafiPay API_PURCHASE payload
        // The merchant account receives the funds from the registered accountNo
        const payload = buildWaafiPurchasePayload({
            accountNo: normalizedPhone,
            amount: payment.amount,
            description: `${payment.description} (To Account: ${receiverPhone || 'N/A'})`,
            referenceId: payment.referenceId,
            invoiceId: payment.invoiceId,
            requestId: payment.requestId
        });

        const providerResponse = await sendWaafiRequest(payload);
        const responseBody = providerResponse.data || {};
        const responseParams = responseBody.params || {};
        const isSuccess = isWaafiSuccessResponse(providerResponse);

        // Update payment with real response data
        payment.providerResponse = responseBody;
        payment.responseCode = responseBody.responseCode
            ? String(responseBody.responseCode)
            : String(providerResponse.statusCode);
        payment.errorCode = responseBody.errorCode
            ? String(responseBody.errorCode)
            : undefined;
        payment.transactionId =
            responseParams.transactionId ||
            responseParams.issuerTransactionId ||
            payment.referenceId;
        payment.status = isSuccess ? 'success' : 'failed';
        payment.paidDate = new Date();
        await payment.save();

        if (isSuccess && payment.amount >= Number(bill.amount)) {
            bill.status = 'paid';
            await bill.save();
        }

        await Notification.create({
            userId: req.user._id,
            message: isSuccess
                ? `Payment of $${payment.amount} for "${bill.title}" was successful.`
                : `Payment for "${bill.title}" failed: ${responseBody.responseMsg || 'Unknown error'}`
        });

        await AuditLog.create({
            userId: req.user._id,
            action: 'PAYMENT_WAAFIPAY_REAL',
            resource: 'Payment',
            details: {
                billId,
                amount: payment.amount,
                phoneNumber: normalizedPhone,
                receiverPhone: receiverPhone,
                transactionId: payment.transactionId,
                status: payment.status,
                responseMsg: responseBody.responseMsg
            }
        });

        return res.status(isSuccess ? 201 : 400).json({
            payment,
            message: isSuccess
                ? 'Payment initiated successfully. Please check your phone for the USSD prompt.'
                : responseBody.responseMsg || 'Payment failed',
            providerResponse: responseBody
        });
    } catch (error) {
        console.error(error);

        await AuditLog.create({
            userId: req.user?._id,
            action: 'PAYMENT_WAAFIPAY_ERROR',
            resource: 'Payment',
            details: {
                billId,
                amount,
                message: error.message
            }
        }).catch(() => {});

        return res.status(500).json({
            message: error.message || 'Server error'
        });
    }
};

const processStripePayment = async (req, res) => {
    const { billId, amount } = req.body;
    try {
        const bill = await Bill.findById(billId);
        if (!bill) return res.status(404).json({ message: 'Bill not found' });

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(numericAmount * 100),
            currency: 'usd',
            metadata: { billId: bill._id.toString(), userId: req.user._id.toString() }
        });

        await Payment.create({
            billId,
            userId: req.user._id,
            amount: Number(numericAmount.toFixed(2)),
            method: 'Stripe',
            status: 'pending',
            provider: 'Stripe',
            transactionId: paymentIntent.id
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getPaymentHistory = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
        const payments = await Payment.find(query)
            .populate('billId', 'title category amount')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const downloadReceipt = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('billId');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        const user = await User.findById(payment.userId).select('-password');
        const bill = payment.billId;

        const pdfBuffer = await generateReceiptPDF(payment, bill, user);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=receipt-${payment._id}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating receipt' });
    }
};

module.exports = {
    processWaafiPayment,
    processStripePayment,
    getPaymentHistory,
    downloadReceipt
};
