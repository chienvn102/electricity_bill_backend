const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/sms/pending - Get one pending SMS (for Admin SMS Worker)
router.get('/pending', adminMiddleware, async (req, res) => {
    try {
        // Get one pending SMS
        const [jobs] = await db.query(
            'SELECT * FROM sms_queue WHERE status = ? ORDER BY created_at ASC LIMIT 1',
            ['pending']
        );

        if (jobs.length === 0) {
            return res.status(204).send(); // No content
        }

        const job = jobs[0];

        // IMPORTANT: Mark as 'processing' immediately to prevent duplicate sends
        await db.query(
            'UPDATE sms_queue SET status = ? WHERE id = ? AND status = ?',
            ['processing', job.id, 'pending']
        );

        res.json({
            id: job.id,
            phone: job.phone,
            message: job.message,
        });
    } catch (err) {
        console.error('SMS pending error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/sms/report - Report SMS send result
router.post('/report', adminMiddleware, async (req, res) => {
    try {
        const { id, status, error } = req.body;

        if (!id || !status) {
            return res.status(400).json({ error: 'id and status required' });
        }

        if (!['sent', 'failed'].includes(status)) {
            return res.status(400).json({ error: 'status must be sent or failed' });
        }

        await db.query(
            'UPDATE sms_queue SET status = ?, error_message = ?, sent_at = NOW() WHERE id = ?',
            [status, error || null, id]
        );

        res.json({ message: 'Report received' });
    } catch (err) {
        console.error('SMS report error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/sms/queue - List all SMS (admin dashboard)
router.get('/queue', adminMiddleware, async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM sms_queue';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const [jobs] = await db.query(query, params);

        res.json({
            count: jobs.length,
            jobs,
        });
    } catch (err) {
        console.error('SMS queue error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/sms/create - Add SMS to queue
router.post('/create', adminMiddleware, async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'phone and message required' });
        }

        const [result] = await db.query(
            'INSERT INTO sms_queue (phone, message) VALUES (?, ?)',
            [phone, message]
        );

        // Emit WebSocket event for real-time notification
        const io = req.app.get('io');
        if (io) {
            io.emit('new_sms', {
                id: result.insertId,
                phone,
                message: message.substring(0, 50) + '...'
            });
        }

        res.status(201).json({
            message: 'SMS added to queue',
            id: result.insertId,
        });
    } catch (err) {
        console.error('SMS create error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/sms/reset-stuck - Reset stuck 'processing' SMS back to 'pending'
// Call this if app crashed while processing
router.post('/reset-stuck', adminMiddleware, async (req, res) => {
    try {
        // Reset SMS stuck in 'processing' for more than 2 minutes
        const [result] = await db.query(
            `UPDATE sms_queue SET status = 'pending' 
       WHERE status = 'processing' 
       AND created_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE)`
        );

        res.json({
            message: 'Reset complete',
            affected: result.affectedRows,
        });
    } catch (err) {
        console.error('Reset stuck error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
