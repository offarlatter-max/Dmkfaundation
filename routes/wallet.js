import express from 'express';
import { requireLogin, requireAdmin } from '../middleware/auth.js';
import { validateFormData } from '../utils/validation.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

const router = express.Router();

// Get Wallet Balance
router.get('/balance', requireLogin, (req, res) => {
  try {
    sendSuccess(res, {
      balance: global.db.wallet.balance,
      lastUpdated: new Date()
    }, 'Wallet balance retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve wallet balance', 500);
  }
});

// Get Wallet Transactions
router.get('/transactions', requireLogin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = global.db.wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    sendSuccess(res, transactions, 'Wallet transactions retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve transactions', 500);
  }
});

// Add Funds to Wallet (Admin only)
router.post('/add-funds', requireAdmin, (req, res) => {
  try {
    const { amount, description, reference } = req.body;

    if (!amount || !description) {
      return sendValidationError(res, ['Amount and description are required']);
    }

    const fundAmount = parseFloat(amount);
    if (fundAmount <= 0) {
      return sendValidationError(res, ['Amount must be greater than 0']);
    }

    global.db.wallet.balance += fundAmount;
    global.db.wallet.transactions.push({
      id: Math.random().toString(36).substr(2, 9),
      type: 'credit',
      amount: fundAmount,
      description: description.trim(),
      reference: reference?.trim() || '',
      date: new Date(),
      addedBy: req.session.user.username
    });

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Add Wallet Funds',
      details: { amount: fundAmount, description },
      timestamp: new Date()
    });

    sendSuccess(res, {
      balance: global.db.wallet.balance,
      amountAdded: fundAmount,
      timestamp: new Date()
    }, 'Funds added successfully');

  } catch (error) {
    sendError(res, error, 'Failed to add funds', 500);
  }
});

// Debit from Wallet (Admin only)
router.post('/debit', requireAdmin, (req, res) => {
  try {
    const { amount, description, reference } = req.body;

    if (!amount || !description) {
      return sendValidationError(res, ['Amount and description are required']);
    }

    const debitAmount = parseFloat(amount);
    if (debitAmount <= 0) {
      return sendValidationError(res, ['Amount must be greater than 0']);
    }

    if (global.db.wallet.balance < debitAmount) {
      return sendError(res, 'Insufficient balance', 'Not enough balance in wallet', 400);
    }

    global.db.wallet.balance -= debitAmount;
    global.db.wallet.transactions.push({
      id: Math.random().toString(36).substr(2, 9),
      type: 'debit',
      amount: debitAmount,
      description: description.trim(),
      reference: reference?.trim() || '',
      date: new Date(),
      debitedBy: req.session.user.username
    });

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Debit Wallet',
      details: { amount: debitAmount, description },
      timestamp: new Date()
    });

    sendSuccess(res, {
      balance: global.db.wallet.balance,
      amountDebited: debitAmount,
      timestamp: new Date()
    }, 'Amount debited successfully');

  } catch (error) {
    sendError(res, error, 'Failed to debit wallet', 500);
  }
});

export default router;
