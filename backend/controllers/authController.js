const User = require('../models/User');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP, sendResetOTP } = require('../utils/emailService');
const admin = require('../config/firebase');
const {
    normalizePhoneNumber,
    isValidWaafiPhoneNumber
} = require('../utils/waafiPay');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const allowOtpFallback = () => process.env.ALLOW_OTP_FALLBACK !== 'false';
const shouldExposeOtp = () => process.env.OFFLINE_MODE === 'true' || process.env.SHOW_DEBUG_OTP === 'true';

const otpResponse = (payload, otp, { exposeOtp = false } = {}) => {
    const response = { ...payload };
    if (exposeOtp || shouldExposeOtp()) response.debugOtp = otp;
    return response;
};

const otpEmailFailureMessage = 'OTP email service is temporarily unavailable. Configure an HTTPS email provider (RESEND_API_KEY, BREVO_API_KEY, or SENDGRID_API_KEY) or working SMTP credentials on Render, then try again.';
const otpEmailFallbackMessage = 'OTP email could not be delivered automatically. Use the verification code shown in the app, or configure an HTTPS email provider on Render for inbox delivery.';

const handleOtpEmailFailure = (res, email, otp, message = otpEmailFallbackMessage) => {
    if (!allowOtpFallback()) {
        return res.status(503).json({
            success: false,
            message: otpEmailFailureMessage,
            emailDelivery: 'failed'
        });
    }

    return res.status(200).json(otpResponse({
        success: true,
        message,
        requiresOtp: true,
        email,
        emailDelivery: 'fallback'
    }, otp, { exposeOtp: true }));
};

const registerUser = async (req, res) => {
    const { name, email, password, phone, fcmToken } = req.body;
    try {
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'Name, email, password, and phone number are required' });
        }

        // Validate name (letters and spaces only)
        if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
            return res.status(400).json({ message: 'Name can only contain letters and spaces' });
        }

        // Enforce Gmail only
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail.endsWith('@gmail.com')) {
            return res.status(400).json({ message: 'Only Gmail addresses (@gmail.com) are accepted' });
        }
        if (!/^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Invalid Gmail address format' });
        }

        const normalizedPhone = normalizePhoneNumber(phone);
        if (!normalizedPhone || normalizedPhone.length < 7 || normalizedPhone.length > 15) {
            return res.status(400).json({ message: 'Please provide a valid phone number' });
        }

        // Check if user already exists and is active in DB
        const emailUser = await User.findOne({ email: normalizedEmail });
        if (emailUser && emailUser.status === 'active') {
            return res.status(400).json({ message: 'This Gmail is already registered. Please sign in instead.' });
        }
        const phoneUser = await User.findOne({ phone: normalizedPhone });
        if (phoneUser) {
            if (phoneUser.status === 'active') {
                return res.status(400).json({ message: 'This phone number is already registered.' });
            }
            if (phoneUser.email !== normalizedEmail) {
                return res.status(400).json({ message: 'This phone number is already registered to another account.' });
            }
        }

        // Generate 6-digit OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let savedUser;
        if (emailUser) {
            // Re-use the existing inactive user record
            emailUser.name = name.trim();
            emailUser.phone = normalizedPhone;
            emailUser.password = hashedPassword;
            emailUser.otp = otp;
            emailUser.otpExpiry = otpExpiry;
            savedUser = await emailUser.save();
        } else {
            // Create a new inactive user
            savedUser = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                phone: normalizedPhone,
                password: hashedPassword,
                role: 'user',
                status: 'inactive',
                otp,
                otpExpiry
            });
        }
        const emailSent = await sendOTP(normalizedEmail, otp);
        if (!emailSent) {
            return handleOtpEmailFailure(res, normalizedEmail, otp);
        }

        // HADDII uu jiro fcmToken, isla markiiba Push Notification ahaan ugu dir OTP-ga moobilka!
        if (fcmToken && admin) {
            const message = {
                notification: { 
                    title: 'Xaqiijinta Koontada (OTP)', 
                    body: `Koodkaaga xaqiijintu waa: ${otp}. Koodkan wuxuu dhacayaa 10 daqiiqo ka dib.` 
                },
                token: fcmToken
            };
            admin.messaging().send(message)
                .then(() => console.log(`âœ… OTP Push Notification sent directly to device.`))
                .catch(err => console.error('âš ï¸ Failed to send OTP Push Notification:', err));
        }
        // Email-ka waa la xaqiijiyay in la diray ka hor inta aan response la celin.
        res.status(200).json(otpResponse({
            success: true,
            message: 'OTP sent to Gmail',
            requiresOtp: true,
            email: normalizedEmail,
            emailDelivery: 'sent'
        }, otp));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyRegisterOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'User not found or registration expired.' });
        }

        if (user.status === 'active') {
            return res.status(400).json({ message: 'This account is already active. Please log in.' });
        }

        if (user.otp !== otp.trim() || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Incorrect or expired verification code. Please try again.' });
        }

        // Activate the user
        user.status = 'active';
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        await AuditLog.create({
            userId: user._id,
            action: 'REGISTER',
            resource: 'User',
            details: { email: normalizedEmail, phone: user.phone }
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    const { email, password, fcmToken } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ message: 'Please verify your email registration first.' });
        }

        // Direct login without OTP - OTP is only for registration
        await AuditLog.create({ userId: user._id, action: 'LOGIN', resource: 'User', details: { email: normalizedEmail } });
        
        // Update FCM token if provided
        if (fcmToken) {
            user.fcmToken = fcmToken;
            await user.save();
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyLoginOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'User not found.' });
        }

        if (user.status !== 'active') {
            return res.status(400).json({ message: 'This account is not active. Please register first.' });
        }

        if (user.otp !== otp.trim() || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Incorrect or expired verification code. Please try again.' });
        }

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        await AuditLog.create({ userId: user._id, action: 'LOGIN', resource: 'User', details: { email: normalizedEmail } });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resendLoginOtp = async (req, res) => {
    const { email, fcmToken } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        
        const user = await User.findOne({ email: normalizedEmail, status: 'active' });
        if (!user) {
            return res.status(400).json({ message: 'No active user found for this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const emailSent = await sendOTP(normalizedEmail, otp);
        if (!emailSent) {
            return handleOtpEmailFailure(res, normalizedEmail, otp);
        }

        if (fcmToken && admin) {
            const message = {
                notification: { 
                    title: 'Xaqiijinta Gelitaanka (Login OTP)', 
                    body: `Koodkaaga cusub waa: ${otp}. Koodkan wuxuu dhacayaa 10 daqiiqo ka dib.` 
                },
                token: fcmToken
            };
            admin.messaging().send(message).catch(err => console.error('âš ï¸ Failed to send Login OTP Push Notification:', err));
        }

        res.status(200).json(otpResponse({
            success: true,
            message: 'OTP resent successfully',
            requiresOtp: true,
            email: normalizedEmail,
            emailDelivery: 'sent'
        }, otp));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || user.status !== 'active') {
            return res.status(400).json({ message: 'User with this Gmail address does not exist or is inactive' });
        }

        // Generate 6-digit OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP to Gmail
        const emailSent = await sendResetOTP(normalizedEmail, otp);
        if (!emailSent) {
            if (allowOtpFallback()) {
                return res.status(200).json(otpResponse({
                    success: true,
                    message: 'Password reset OTP email could not be delivered automatically. Use the verification code shown in the app.',
                    email: normalizedEmail,
                    emailDelivery: 'fallback'
                }, otp, { exposeOtp: true }));
            }

            // Revert OTP if failed to send and fallback is disabled.
            user.otp = undefined;
            user.otpExpiry = undefined;
            await user.save();

            return res.status(503).json({
                success: false,
                message: otpEmailFailureMessage
            });
        }

        res.status(200).json(otpResponse({
            success: true,
            message: 'Password reset OTP sent to Gmail',
            email: normalizedEmail,
            emailDelivery: 'sent'
        }, otp));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.otp !== otp.trim() || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Incorrect or expired verification code. Please try again.' });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[!@#\$%\^&\*\(\)_\+\-\=\[\]\{\};:\x27\x22,<>\.\?\/\\|`~]/.test(newPassword)) {
            return res.status(400).json({ message: 'Password must contain letters, numbers, and symbols' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        await AuditLog.create({
            userId: user._id,
            action: 'RESET_PASSWORD',
            resource: 'User',
            details: { email: normalizedEmail }
        });

        res.status(200).json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
const resendRegisterOtp = async (req, res) => {
    const { email, fcmToken } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        
        const user = await User.findOne({ email: normalizedEmail, status: 'inactive' });
        if (!user) {
            return res.status(400).json({ message: 'No pending registration found for this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const emailSent = await sendOTP(normalizedEmail, otp);
        if (!emailSent) {
            return handleOtpEmailFailure(res, normalizedEmail, otp);
        }

        if (fcmToken && admin) {
            const message = {
                notification: { 
                    title: 'Xaqiijinta Koontada (OTP)', 
                    body: `Koodkaaga cusub waa: ${otp}. Koodkan wuxuu dhacayaa 10 daqiiqo ka dib.` 
                },
                token: fcmToken
            };
            admin.messaging().send(message).catch(err => console.error('âš ï¸ Failed to send OTP Push Notification:', err));
        }

        res.status(200).json(otpResponse({
            success: true,
            message: 'OTP resent successfully',
            requiresOtp: true,
            email: normalizedEmail,
            emailDelivery: 'sent'
        }, otp));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, verifyRegisterOtp, loginUser, forgotPassword, resetPassword, resendRegisterOtp, verifyLoginOtp, resendLoginOtp };
