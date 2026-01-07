const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/otp/request
 * Request OTP for password reset - adds to SMS queue
 */
router.post('/request', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number required' });
        }

        // Check if user exists
        const [users] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Phone number not registered' });
        }

        // Rate limiting: Check if OTP was requested within last 2 minutes
        const [recentOtp] = await db.query(
            `SELECT created_at FROM otp_codes 
       WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
       ORDER BY created_at DESC LIMIT 1`,
            [phone]
        );

        if (recentOtp.length > 0) {
            const waitSeconds = Math.ceil(
                (new Date(recentOtp[0].created_at).getTime() + 2 * 60 * 1000 - Date.now()) / 1000
            );
            return res.status(429).json({
                error: `Vui lòng đợi ${waitSeconds} giây trước khi yêu cầu lại`,
                retryAfter: waitSeconds,
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete old OTPs for this phone (keep rate limit check working)
        await db.query('DELETE FROM otp_codes WHERE phone = ? AND used = TRUE', [phone]);

        // Save OTP
        await db.query(
            'INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)',
            [phone, otp, expiresAt]
        );

        // Add SMS to queue (will be sent by Admin SMS Worker)
        const message = `Ma OTP cua ban la: ${otp}. Ma se het han sau 5 phut.`;
        const [smsResult] = await db.query(
            'INSERT INTO sms_queue (phone, message, status) VALUES (?, ?, ?)',
            [phone, message, 'pending']
        );

        // Emit WebSocket event for real-time notification
        const io = req.app.get('io');
        if (io) {
            io.emit('new_sms', {
                id: smsResult.insertId,
                phone,
                message: message.substring(0, 50) + '...',
                type: 'otp'
            });
        }

        res.json({
            message: 'OTP sent to your phone',
            expiresIn: 300, // 5 minutes in seconds
        });
    } catch (err) {
        console.error('OTP request error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/otp/verify
 * Verify OTP code
 */
router.post('/verify', async (req, res) => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ error: 'Phone and OTP code required' });
        }

        // Find valid OTP
        const [otps] = await db.query(
            'SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND expires_at > NOW() AND used = FALSE',
            [phone, code]
        );

        if (otps.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Mark OTP as used
        await db.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otps[0].id]);

        // Generate reset token (valid for 10 minutes)
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Save reset token (reuse otp_codes table)
        await db.query(
            'INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)',
            [phone, `reset:${resetToken}`, resetExpires]
        );

        res.json({
            message: 'OTP verified',
            resetToken,
            expiresIn: 600, // 10 minutes
        });
    } catch (err) {
        console.error('OTP verify error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/otp/reset-password
 * Reset password using reset token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { phone, resetToken, newPassword } = req.body;

        if (!phone || !resetToken || !newPassword) {
            return res.status(400).json({ error: 'Phone, resetToken and newPassword required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Verify reset token
        const [tokens] = await db.query(
            'SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND expires_at > NOW() AND used = FALSE',
            [phone, `reset:${resetToken}`]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.query('UPDATE users SET password = ? WHERE phone = ?', [hashedPassword, phone]);

        // Mark token as used
        await db.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [tokens[0].id]);

        // Clean up old otp codes for this phone
        await db.query('DELETE FROM otp_codes WHERE phone = ? AND used = TRUE', [phone]);

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
