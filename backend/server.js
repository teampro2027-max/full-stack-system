const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config({ override: true });
connectDB();

// Auto-seed default admin and user if database has no users
mongoose.connection.once('open', async () => {
    try {
        const User = require('./models/User');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Database is empty. Auto-seeding default admin and test users...');
            const bcrypt = require('bcryptjs');
            const adminPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'System Admin',
                email: 'admin@admin.com',
                password: adminPassword,
                role: 'admin',
                mfaEnabled: false
            });
            const userPassword = await bcrypt.hash('user123', 10);
            await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: userPassword,
                role: 'user'
            });
            console.log('Database auto-seeded successfully! Admin: admin@admin.com (admin123), User: john@example.com (user123)');
        }
    } catch (err) {
        console.error('Failed to auto-seed database:', err.message);
    }
});

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
app.use('/api/support', require('./routes/supportRoutes'));

// Setup Cron Jobs
const setupCronJobs = require('./utils/cronJobs');
setupCronJobs();

const apiStatus = () => ({
    message: 'MultiBill API is running',
    version: '2.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected',
});

app.get('/', (req, res) => {
    res.json(apiStatus());
});

app.get(['/api', '/api/'], (req, res) => {
    res.json(apiStatus());
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, ...apiStatus() });
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

        // Test 6: Direct IPv4 resolve for port 465 (secure)
        let verify6Success = false;
        let verify6Error = null;
        let resolvedIp = null;
        try {
            const dns = require('dns').promises;
            const ips = await dns.resolve4('smtp.gmail.com');
            if (ips && ips.length > 0) {
                resolvedIp = ips[0];
                const transporter6 = nodemailer.createTransport({
                    host: resolvedIp,
                    port: 465,
                    secure: true,
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                    auth: {
                        user: smtpEmail,
                        pass: smtpPassword,
                    },
                    tls: {
                        servername: 'smtp.gmail.com'
                    }
                });
                await transporter6.verify();
                verify6Success = true;
            } else {
                verify6Error = "No IPv4 address resolved for smtp.gmail.com";
            }
        } catch (err) {
            verify6Error = err.message;
        }

        // Test 7: Direct IPv4 resolve for port 587 (TLS)
        let verify7Success = false;
        let verify7Error = null;
        try {
            if (resolvedIp) {
                const transporter7 = nodemailer.createTransport({
                    host: resolvedIp,
                    port: 587,
                    secure: false,
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                    auth: {
                        user: smtpEmail,
                        pass: smtpPassword,
                    },
                    tls: {
                        servername: 'smtp.gmail.com'
                    }
                });
                await transporter7.verify();
                verify7Success = true;
            } else {
                verify7Error = "No resolved IPv4 IP available";
            }
        } catch (err) {
            verify7Error = err.message;
        }

        return res.status(200).json({
            success: verify1Success || verify2Success || verify3Success || verify4Success || verify5Success || verify6Success || verify7Success,
            SMTP_EMAIL: smtpEmail,
            resolvedIp,
            test1_gmail_service: { success: verify1Success, error: verify1Error },
            test2_port465: { success: verify2Success, error: verify2Error },
            test3_port587: { success: verify3Success, error: verify3Error },
            test4_port465_ipv4: { success: verify4Success, error: verify4Error },
            test5_port587_ipv4: { success: verify5Success, error: verify5Error },
            test6_port465_directIp: { success: verify6Success, error: verify6Error },
            test7_port587_directIp: { success: verify7Success, error: verify7Error }
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
    console.log(`\nðŸš€ MultiBill API running on port ${PORT}`);
    console.log(`ðŸ“¡ Endpoints: http://localhost:${PORT}/api/`);
});

