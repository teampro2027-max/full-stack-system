const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { generateReceiptPDF } = require('../utils/pdfGenerator');
const { sendPushNotification } = require('./notificationController');
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
            receiverPhone: receiverPhone,
            description: description || `Payment for ${bill.title || 'bill'} to ${receiverPhone}`
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
        let providerResponse;
        let responseBody;
        let responseParams;
        let isSuccess;

        if (process.env.OFFLINE_MODE === 'true') {
            console.log(`\n==================================================`);
            console.log(`💳 [OFFLINE WAAFIPAY MOCK] Bypassing actual WaafiPay API request`);
            console.log(`Amount: $${payment.amount} | Phone: ${normalizedPhone}`);
            console.log(`==================================================\n`);
            
            providerResponse = { statusCode: 200, data: { responseCode: '2001', responseMsg: 'Success', params: { transactionId: 'TXN-MOCK-' + Math.random().toString(36).substring(2, 9) } } };
            responseBody = providerResponse.data;
            responseParams = responseBody.params;
            isSuccess = true;
        } else {
            providerResponse = await sendWaafiRequest(payload);
            responseBody = providerResponse.data || {};
            responseParams = responseBody.params || {};
            isSuccess = isWaafiSuccessResponse(providerResponse);
        }

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

        // Hadda biilka waxaa loo calaamadeynayaa 'paid' haddii lacag kasta ay guuleysato
        if (isSuccess) {
            bill.status = 'paid';
            bill.lastPaidDate = new Date();
            await bill.save();
        }

        const notificationTitle = isSuccess ? 'Lacag-bixin Guuleysatay' : 'Lacag-bixin Fashilantay';
        const notificationMsg = isSuccess
            ? `Lacagtaada $${payment.amount} ee "${bill.title}" waa lagaa aqbalay.`
            : `Lacag-bixintii "${bill.title}" way fashilantay: ${responseBody.responseMsg || 'Cillad ayaa dhacday'}`;

        await Notification.create({
            userId: req.user._id,
            title: notificationTitle,
            message: notificationMsg
        });

        // U dir Push Notification talefanka
        await sendPushNotification(req.user._id, notificationTitle, notificationMsg);

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
    getPaymentHistory,
    downloadReceipt
};
