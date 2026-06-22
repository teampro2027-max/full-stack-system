const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config({ override: true });
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Setup Cron Jobs
const setupCronJobs = require('./utils/cronJobs');
setupCronJobs();

app.get('/', (req, res) => {
    res.json({ message: 'MultiBill API is running ✓', version: '2.0.0' });
});

app.get('/api/diag/email-test', async (req, res) => {
    try {
        const nodemailer = require('nodemailer');
        const smtpEmail = process.env.SMTP_EMAIL;
        const smtpPassword = process.env.SMTP_PASSWORD;
        if (!smtpEmail || !smtpPassword) {
            return res.status(400).json({
                success: false,
                message: 'SMTP credentials missing from environment variables',
                SMTP_EMAIL_Exists: !!smtpEmail,
                SMTP_PASSWORD_Exists: !!smtpPassword
            });
        }

        // Test 1: service: 'gmail'
        const transporter1 = nodemailer.createTransport({
            service: 'gmail',
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
            auth: {
                user: smtpEmail,
                pass: smtpPassword,
            },
        });

        let verify1Success = false;
        let verify1Error = null;
        try {
            await transporter1.verify();
            verify1Success = true;
        } catch (err) {
            verify1Error = err.message;
        }

        // Test 2: port 465 (secure)
        const transporter2 = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
            auth: {
                user: smtpEmail,
                pass: smtpPassword,
            },
        });

        let verify2Success = false;
        let verify2Error = null;
        try {
            await transporter2.verify();
            verify2Success = true;
        } catch (err) {
            verify2Error = err.message;
        }

        // Test 3: port 587 (TLS)
        const transporter3 = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
            auth: {
                user: smtpEmail,
                pass: smtpPassword,
            },
        });

        let verify3Success = false;
        let verify3Error = null;
        try {
            await transporter3.verify();
            verify3Success = true;
        } catch (err) {
            verify3Error = err.message;
        }

        // Test 4: port 465 (secure) forcing IPv4
        const transporter4 = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            family: 4,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
            auth: {
                user: smtpEmail,
                pass: smtpPassword,
            },
        });

        let verify4Success = false;
        let verify4Error = null;
        try {
            await transporter4.verify();
            verify4Success = true;
        } catch (err) {
            verify4Error = err.message;
        }

        // Test 5: port 587 (TLS) forcing IPv4
        const transporter5 = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            family: 4,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
            auth: {
                user: smtpEmail,
                pass: smtpPassword,
            },
        });

        let verify5Success = false;
        let verify5Error = null;
        try {
            await transporter5.verify();
            verify5Success = true;
        } catch (err) {
            verify5Error = err.message;
        }

        return res.status(200).json({
            success: verify1Success || verify2Success || verify3Success || verify4Success || verify5Success,
            SMTP_EMAIL: smtpEmail,
            test1_gmail_service: { success: verify1Success, error: verify1Error },
            test2_port465: { success: verify2Success, error: verify2Error },
            test3_port587: { success: verify3Success, error: verify3Error },
            test4_port465_ipv4: { success: verify4Success, error: verify4Error },
            test5_port587_ipv4: { success: verify5Success, error: verify5Error }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Diagnostic script failed',
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 MultiBill API running on port ${PORT}`);
    console.log(`📡 Endpoints: http://localhost:${PORT}/api/`);
});
