import express from 'express';
const router = express.Router();

// Reports placeholders
router.get('/cash-book', (req, res) => res.json({ message: 'Cash book report' }));
router.get('/collection-report', (req, res) => res.json({ message: 'Collection report' }));
router.get('/loan-report', (req, res) => res.json({ message: 'Loan report' }));

export default router;
