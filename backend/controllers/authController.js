const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const {
    normalizePhoneNumber,
    isValidWaafiPhoneNumber
} = require('../utils/waafiPay');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    try {
        const normalizedPhone = normalizePhoneNumber(phone);

        if (!name || !email || !password || !normalizedPhone) {
            return res.status(400).json({ message: 'Name, email, password, and phone number are required' });
        }

        if (!isValidWaafiPhoneNumber(normalizedPhone)) {
            return res.status(400).json({ message: 'Phone number must be in WaafiPay format like 2526XXXXXXXX' });
        }

        const userExists = await User.findOne({
            $or: [{ email }, { phone: normalizedPhone }]
        });

        if (userExists) {
            if (userExists.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            return res.status(400).json({ message: 'Phone number already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate MFA secret
        const mfaSecret = speakeasy.generateSecret({ name: `MultiBill (${email})` });

        const user = await User.create({
            name,
            email,
            phone: normalizedPhone,
            password: hashedPassword,
            role: role || 'user',
            mfaSecret: mfaSecret.base32,
            mfaEnabled: false
        });

        // Generate QR code for authenticator app
        const qrCodeUrl = await qrcode.toDataURL(mfaSecret.otpauth_url);

        await AuditLog.create({
            userId: user._id,
            action: 'REGISTER',
            resource: 'User',
            details: { email, phone: normalizedPhone }
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id),
            mfaSecret: mfaSecret.base32,
            mfaQrCode: qrCodeUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    const { email, password, mfaToken } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // If MFA is enabled, verify token
        if (user.mfaEnabled) {
            if (!mfaToken) {
                return res.status(200).json({ requiresMfa: true, message: 'MFA token required' });
            }
            const isValid = speakeasy.totp.verify({
                secret: user.mfaSecret,
                encoding: 'base32',
                token: mfaToken,
                window: 1
            });
            if (!isValid) return res.status(401).json({ message: 'Invalid MFA token' });
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

const enableMfa = async (req, res) => {
    const { mfaToken } = req.body;
    try {
        const user = await User.findById(req.user._id);
        const isValid = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: mfaToken,
            window: 1
        });
        if (!isValid) return res.status(400).json({ message: 'Invalid MFA token' });

        user.mfaEnabled = true;
        await user.save();
        res.json({ message: 'MFA enabled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const disableMfa = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.mfaEnabled = false;
        await user.save();
        res.json({ message: 'MFA disabled' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getMfaSetup = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // If secret doesn't exist (legacy user), generate one
        if (!user.mfaSecret) {
            const mfaSecret = speakeasy.generateSecret({ name: `MultiBill (${user.email})` });
            user.mfaSecret = mfaSecret.base32;
            await user.save();
        }

        const mfaSecretObj = {
            base32: user.mfaSecret,
            otpauth_url: `otpauth://totp/MultiBill:${user.email}?secret=${user.mfaSecret}&issuer=MultiBill`
        };

        const qrCodeUrl = await qrcode.toDataURL(mfaSecretObj.otpauth_url);

        res.json({
            mfaSecret: user.mfaSecret,
            mfaQrCode: qrCodeUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser, enableMfa, disableMfa, getMfaSetup };
