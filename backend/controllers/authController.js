const User = require('../models/User');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../utils/emailService');
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

        if (emailUser) {
            // Re-use the existing inactive user record
            emailUser.name = name.trim();
            emailUser.phone = normalizedPhone;
            emailUser.password = hashedPassword;
            emailUser.otp = otp;
            emailUser.otpExpiry = otpExpiry;
            await emailUser.save();
        } else {
            // Create a new inactive user
            await User.create({
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

        // Send OTP to Gmail
        const emailSent = await sendOTP(normalizedEmail, otp);
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send OTP verification email' });
        }

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

module.exports = { registerUser, verifyRegisterOtp, loginUser };

