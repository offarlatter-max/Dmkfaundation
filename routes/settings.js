import express from 'express';
const router = express.Router();

// Settings placeholders
router.get('/', (req, res) => res.json({ message: 'System settings' }));
router.put('/update', (req, res) => res.json({ message: 'Update settings' }));

export default router;
