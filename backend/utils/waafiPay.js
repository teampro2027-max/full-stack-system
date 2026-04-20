const https = require('https');
const crypto = require('crypto');

const DEFAULT_WAAFI_URL = 'https://api.waafipay.net/asm';

const normalizePhoneNumber = (value = '') => String(value).replace(/\D/g, '');

const isValidWaafiPhoneNumber = (value = '') =>
    /^2526\d{8}$/.test(normalizePhoneNumber(value));

const generateNumericSuffix = (size = 6) => {
    const digits = '0123456789';
    let suffix = '';

    for (let index = 0; index < size; index += 1) {
        suffix += digits[crypto.randomInt(0, digits.length)];
    }

    return suffix;
};

const pad = (value, length = 2) => String(value).padStart(length, '0');

const formatWaafiTimestamp = (date = new Date()) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
};

const generateRequestId = () => `${Date.now()}${generateNumericSuffix(6)}`;

const generateReferenceId = () =>
    `${Date.now()}${generateNumericSuffix(7)}`;

const generateInvoiceId = () =>
    `${Date.now()}${generateNumericSuffix(8)}`;

const getWaafiConfig = () => {
    const config = {
        url: process.env.WAAFI_API_URL || DEFAULT_WAAFI_URL,
        merchantUid: process.env.WAAFI_MERCHANT_UID,
        apiUserId: process.env.WAAFI_API_USER_ID,
        apiKey: process.env.WAAFI_API_KEY
    };

    if (!config.merchantUid || !config.apiUserId || !config.apiKey) {
        throw new Error('WaafiPay credentials are not configured on the backend');
    }

    return config;
};

const buildWaafiPurchasePayload = ({
    accountNo,
    amount,
    description,
    referenceId,
    invoiceId,
    requestId
}) => {
    const config = getWaafiConfig();

    return {
        schemaVersion: '1.0',
        requestId,
        timestamp: formatWaafiTimestamp(),
        channelName: 'WEB',
        serviceName: 'API_PURCHASE',
        serviceParams: {
            merchantUid: config.merchantUid,
            apiUserId: config.apiUserId,
            apiKey: config.apiKey,
            paymentMethod: 'MWALLET_ACCOUNT',
            payerInfo: {
                accountNo
            },
            transactionInfo: {
                referenceId,
                invoiceId,
                amount: Number(Number(amount).toFixed(2)),
                currency: 'USD',
                description
            }
        }
    };
};

const sendWaafiRequest = (payload) => {
    const { url } = getWaafiConfig();
    const target = new URL(url);
    const body = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
        const request = https.request(
            {
                protocol: target.protocol,
                hostname: target.hostname,
                port: target.port || 443,
                path: `${target.pathname}${target.search}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            },
            (response) => {
                let raw = '';

                response.on('data', (chunk) => {
                    raw += chunk;
                });

                response.on('end', () => {
                    let data = null;

                    try {
                        data = raw ? JSON.parse(raw) : {};
                    } catch (_) {
                        data = { raw };
                    }

                    resolve({
                        statusCode: response.statusCode || 500,
                        data,
                        raw
                    });
                });
            }
        );

        request.setTimeout(30000, () => {
            request.destroy(new Error('WaafiPay request timed out'));
        });

        request.on('error', reject);
        request.write(body);
        request.end();
    });
};

const isWaafiSuccessResponse = (response = {}) => {
    const body = response.data || {};
    const params = body.params || {};
    const responseCode = String(body.responseCode || '');
    const errorCode = String(body.errorCode || '');
    const state = String(params.state || params.status || '').toUpperCase();

    return (
        response.statusCode >= 200 &&
        response.statusCode < 300 &&
        responseCode === '2001' &&
        errorCode === '0' &&
        (state === 'APPROVED' || state === 'SUCCESS')
    );
};

module.exports = {
    normalizePhoneNumber,
    isValidWaafiPhoneNumber,
    formatWaafiTimestamp,
    generateRequestId,
    generateReferenceId,
    generateInvoiceId,
    buildWaafiPurchasePayload,
    sendWaafiRequest,
    isWaafiSuccessResponse
};
