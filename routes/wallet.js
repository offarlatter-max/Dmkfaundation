import express from 'express';
const router = express.Router();

// Wallet Management placeholders
router.get('/balance', (req, res) => res.json({ balance: global.db.wallet.balance }));
router.post('/add-funds', (req, res) => res.json({ message: 'Add funds to wallet' }));

export default router;
