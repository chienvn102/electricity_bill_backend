const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');

// POST /api/login
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and password required' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user.role,
            },
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/register
router.post('/register', async (req, res) => {
    try {
        const { phone, password, name } = req.body;

        if (!phone || !password || !name) {
            return res.status(400).json({ error: 'Phone, password and name required' });
        }

        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Phone already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (phone, password, name) VALUES (?, ?, ?)',
            [phone, hashedPassword, name]
        );

        res.status(201).json({
            message: 'Registration successful',
            user: { id: result.insertId, phone, name },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
