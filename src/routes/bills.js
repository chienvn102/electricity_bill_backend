const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/bills - Get all bills (admin) or user's bills
router.get('/', async (req, res) => {
    try {
        const { phone, month } = req.query;
        let query = 'SELECT * FROM bills WHERE 1=1';
        const params = [];

        // Filter by phone (for user app)
        if (phone) {
            query += ' AND phone = ?';
            params.push(phone);
        } else if (req.user.role !== 'admin') {
            // Non-admin users can only see their own bills
            query += ' AND phone = ?';
            params.push(req.user.phone);
        }

        // Filter by month
        if (month) {
            query += ' AND month = ?';
            params.push(month);
        }

        query += ' ORDER BY created_at DESC';

        const [bills] = await db.query(query, params);

        res.json({
            count: bills.length,
            bills: bills.map(b => ({
                id: b.id,
                phone: b.phone,
                month: b.month,
                customerName: b.customer_name,
                customerCode: b.customer_code,
                kWh: b.kwh,
                amount: b.amount,
                dueDates: b.due_dates,
                rawContent: b.content,
            })),
        });
    } catch (err) {
        console.error('Bills error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/bills/:id - Get single bill
router.get('/:id', async (req, res) => {
    try {
        const [bills] = await db.query('SELECT * FROM bills WHERE id = ?', [req.params.id]);

        if (bills.length === 0) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        const b = bills[0];

        // Check access
        if (req.user.role !== 'admin' && b.phone !== req.user.phone) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({
            id: b.id,
            phone: b.phone,
            month: b.month,
            customerName: b.customer_name,
            customerCode: b.customer_code,
            kWh: b.kwh,
            amount: b.amount,
            dueDates: b.due_dates,
            rawContent: b.content,
        });
    } catch (err) {
        console.error('Bill detail error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
