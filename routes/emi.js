import express from 'express';
const router = express.Router();

// EMI Management placeholders
router.get('/', (req, res) => res.json({ message: 'EMI management module' }));
router.post('/collect', (req, res) => res.json({ message: 'Collect EMI' }));

export default router;
