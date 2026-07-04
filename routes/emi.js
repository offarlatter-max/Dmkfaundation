import express from 'express';
import { requireLogin } from '../middleware/auth.js';
import { validateFormData } from '../utils/validation.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

const router = express.Router();

// Get All EMI Records
router.get('/', requireLogin, (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const status = req.query.status || '';
    const loanId = req.query.loanId || '';

    let emiRecords = global.db.emi;

    if (search) {
      emiRecords = emiRecords.filter(e =>
        e.loanNumber.includes(search) ||
        e.customerId.includes(search)
      );
    }

    if (status) {
      emiRecords = emiRecords.filter(e => e.status === status);
    }

    if (loanId) {
      emiRecords = emiRecords.filter(e => e.loanId === loanId);
    }

    const result = emiRecords.map(e => ({
      id: e.id,
      loanNumber: e.loanNumber,
      emiNumber: e.emiNumber,
      dueDate: e.dueDate,
      amountDue: e.amountDue,
      amountPaid: e.amountPaid,
      status: e.status,
      collectionDate: e.collectionDate
    }));

    sendSuccess(res, result, 'EMI records retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve EMI records', 500);
  }
});

// Get EMI by ID
router.get('/:emiId', requireLogin, (req, res) => {
  try {
    const emi = global.db.emi.find(e => e.id === req.params.emiId);
    if (!emi) {
      return sendError(res, 'EMI not found', 'EMI record not found', 404);
    }

    sendSuccess(res, emi, 'EMI retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve EMI', 500);
  }
});

// Collect EMI
router.post('/collect/:emiId', requireLogin, (req, res) => {
  try {
    const { amountPaid, paymentMode, remarks } = req.body;

    if (!amountPaid || !paymentMode) {
      return sendValidationError(res, ['Amount and payment mode are required']);
    }

    const emi = global.db.emi.find(e => e.id === req.params.emiId);
    if (!emi) {
      return sendError(res, 'EMI not found', 'EMI record not found', 404);
    }

    if (emi.status === 'paid') {
      return sendError(res, 'Already paid', 'This EMI is already paid', 400);
    }

    const amount = parseFloat(amountPaid);

    emi.amountPaid = amount;
    emi.status = amount >= emi.amountDue ? 'paid' : 'partial';
    emi.collectedBy = req.session.user.staffId || req.session.user.adminId;
    emi.collectionDate = new Date();
    emi.paymentMode = paymentMode.trim();
    emi.remarks = remarks?.trim() || '';

    // Record transaction
    global.db.transactions.push({
      id: Math.random().toString(36).substr(2, 9),
      type: 'emi_collection',
      emiId: req.params.emiId,
      loanId: emi.loanId,
      amount,
      paymentMode,
      collectedBy: req.session.user.username,
      collectionDate: new Date(),
      remarks
    });

    // Update wallet balance
    global.db.wallet.balance += amount;
    global.db.wallet.transactions.push({
      id: Math.random().toString(36).substr(2, 9),
      type: 'credit',
      amount,
      description: `EMI Collection - ${emi.loanNumber}`,
      date: new Date()
    });

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Collect EMI',
      details: { loanId: emi.loanNumber, emiNumber: emi.emiNumber, amount },
      timestamp: new Date()
    });

    sendSuccess(res, {
      emiId: req.params.emiId,
      status: emi.status,
      amountPaid: amount,
      collectionDate: emi.collectionDate,
      message: 'EMI collected successfully'
    }, 'EMI collected successfully');

  } catch (error) {
    sendError(res, error, 'Failed to collect EMI', 500);
  }
});

// Get EMI by Loan
router.get('/loan/:loanId', requireLogin, (req, res) => {
  try {
    const emiRecords = global.db.emi.filter(e => e.loanId === req.params.loanId);

    if (emiRecords.length === 0) {
      return sendSuccess(res, [], 'No EMI records found for this loan');
    }

    sendSuccess(res, emiRecords, 'EMI records retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve EMI records', 500);
  }
});

// Get Overdue EMI
router.get('/status/overdue', requireLogin, (req, res) => {
  try {
    const today = new Date();
    const overdueEmi = global.db.emi.filter(e =>
      e.status === 'pending' && new Date(e.dueDate) < today
    );

    const result = overdueEmi.map(e => ({
      id: e.id,
      loanNumber: e.loanNumber,
      emiNumber: e.emiNumber,
      dueDate: e.dueDate,
      amountDue: e.amountDue,
      daysOverdue: Math.floor((today - new Date(e.dueDate)) / (1000 * 60 * 60 * 24))
    }));

    sendSuccess(res, result, 'Overdue EMI records retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve overdue records', 500);
  }
});

export default router;
