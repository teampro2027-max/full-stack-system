const User = require('../models/User');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP, sendResetOTP } = require('../utils/emailService');
const {
    normalizePhoneNumber,
    isValidWaafiPhoneNumber
} = require('../utils/waafiPay');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password, phone } = req.body;
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
        if (phoneUser && phoneUser.status === 'active') {
            return res.status(400).json({ message: 'This phone number is already registered.' });
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

        // OTP-ga email-ka gadaashiisa u dir (background) si Mobile App-ku degdeg ugu helo jawaab
        // Taasi waxay ka hortagtaa "connection abort" error-ka
        sendOTP(normalizedEmail, otp).then(sent => {
            if (!sent) {
                console.warn(`\n==================================================`);
                console.warn(`⚠️ SendGrid failed to send OTP email to ${normalizedEmail}.`);
                console.warn(`==================================================\n`);
            } else {
                console.log(`✅ OTP email sent successfully to ${normalizedEmail}`);
            }
        }).catch(err => {
            console.error('Background OTP email error:', err);
        });

        // Isla markiiba jawaab u cel Mobile App-ka — ha sugin email-ka
        res.status(200).json({
            success: true,
            message: 'OTP sent to email',
            requiresOtp: true,
            email: normalizedEmail
        });
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
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ message: 'Please verify your email registration first.' });
        }

        await AuditLog.create({ userId: user._id, action: 'LOGIN', resource: 'User', details: { email } });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
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
            // Revert OTP if failed to send
            user.otp = undefined;
            user.otpExpiry = undefined;
            await user.save();

            return res.status(400).json({
                message: 'Failed to send verification OTP email. Please make sure the Gmail address exists and is valid.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to email',
            email: normalizedEmail,
            debugOtp: otp
        });
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

module.exports = { registerUser, verifyRegisterOtp, loginUser, forgotPassword, resetPassword };

