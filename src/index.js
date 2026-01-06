require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const billsRoutes = require('./routes/bills');
const smsRoutes = require('./routes/sms');
const otpRoutes = require('./routes/otp');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api', authRoutes);
app.use('/api/otp', otpRoutes);

// Protected routes
app.use('/api/bills', authMiddleware, billsRoutes);
app.use('/api/sms', authMiddleware, smsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Electricity Bill Backend running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
});
