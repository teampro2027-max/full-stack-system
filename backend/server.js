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

// Setup Cron Jobs
const setupCronJobs = require('./utils/cronJobs');
setupCronJobs();

app.get('/', (req, res) => {
    res.json({ message: 'MultiBill API is running ✓', version: '2.0.0' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 MultiBill API running on port ${PORT}`);
    console.log(`📡 Endpoints: http://localhost:${PORT}/api/`);
});
