const User = require('../models/User');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const {
    normalizePhoneNumber,
    isValidWaafiPhoneNumber
} = require('../utils/waafiPay');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOtpEmail = async (email, otp) => {
    console.log(`[OTP] Verification code for ${email} is: ${otp}`);
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'BillTrack Pro - Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                        <h2 style="color: #4F46E5;">Email Verification</h2>
                        <p>Welcome to BillTrack Pro! Use the verification code below to complete your registration:</p>
                        <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4F46E5; padding: 10px; background-color: #f3f4f6; text-align: center; border-radius: 5px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);
            console.log(`[OTP] Email sent successfully to ${email}`);
        } catch (err) {
            console.error('[OTP] Error sending email via SMTP:', err);
        }
    } else {
        console.log('[OTP] SMTP credentials not set. OTP printed to console only.');
    }
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
        if (!isValidWaafiPhoneNumber(normalizedPhone)) {
            return res.status(400).json({ message: 'Phone number must be in WaafiPay format like 2526XXXXXXXX' });
        }

        // Check if user already exists in DB
        const emailUser = await User.findOne({ email: normalizedEmail });
        if (emailUser) {
            return res.status(400).json({ message: 'This Gmail is already registered. Please sign in instead.' });
        }
        const phoneUser = await User.findOne({ phone: normalizedPhone });
        if (phoneUser) {
            return res.status(400).json({ message: 'This phone number is already registered.' });
        }

        // Generate 6-digit OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store OTP details in temporary schema
        await OTP.findOneAndUpdate(
            { email: normalizedEmail },
            {
                otp,
                userData: {
                    name: name.trim(),
                    phone: normalizedPhone,
                    password: hashedPassword
                }
            },
            { upsert: true, new: true }
        );

        // Send OTP to Gmail
        await sendOtpEmail(normalizedEmail, otp);

        res.status(200).json({
            requiresOtp: true,
            email: normalizedEmail,
            message: 'Verification code sent to your Gmail'
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
        const otpRecord = await OTP.findOne({ email: normalizedEmail });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Verification code expired or invalid. Please register again.' });
        }

        if (otpRecord.otp !== otp.trim()) {
            return res.status(400).json({ message: 'Incorrect verification code. Please try again.' });
        }

        const { name, phone, password } = otpRecord.userData;

        // Final duplicate check before creating account
        const emailUser = await User.findOne({ email: normalizedEmail });
        if (emailUser) {
            await OTP.deleteOne({ email: normalizedEmail });
            return res.status(400).json({ message: 'This Gmail is already registered. Please sign in instead.' });
        }
        const phoneUser = await User.findOne({ phone });
        if (phoneUser) {
            return res.status(400).json({ message: 'This phone number is already registered.' });
        }

        // Create the actual user
        const user = await User.create({
            name,
            email: normalizedEmail,
            phone,
            password,
            role: 'user',
            mfaEnabled: false
        });

        // Delete temporary OTP record
        await OTP.deleteOne({ email: normalizedEmail });

        await AuditLog.create({
            userId: user._id,
            action: 'REGISTER',
            resource: 'User',
            details: { email: normalizedEmail, phone }
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

