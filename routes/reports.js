import express from 'express';
import { requireLogin, requireAdmin } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// Generate Loan Report
router.get('/loan-report', requireLogin, (req, res) => {
  try {
    const branch = req.query.branch || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    let loans = global.db.loans;

    if (branch) loans = loans.filter(l => l.branch === branch);
    if (status) loans = loans.filter(l => l.status === status);
    if (startDate) loans = loans.filter(l => new Date(l.appliedAt) >= startDate);
    if (endDate) loans = loans.filter(l => new Date(l.appliedAt) <= endDate);

    const report = {
      totalLoans: loans.length,
      totalAmount: loans.reduce((sum, l) => sum + l.loanAmount, 0),
      statusBreakdown: {
        pending: loans.filter(l => l.status === 'pending').length,
        approved: loans.filter(l => l.status === 'approved').length,
        active: loans.filter(l => l.status === 'active').length,
        closed: loans.filter(l => l.status === 'closed').length,
        rejected: loans.filter(l => l.status === 'rejected').length
      },
      averageLoanAmount: loans.length > 0 ? Math.round(loans.reduce((sum, l) => sum + l.loanAmount, 0) / loans.length) : 0,
      loans: loans.map(l => ({
        loanId: l.loanId,
        customerName: l.customerName,
        loanAmount: l.loanAmount,
        monthlyEmi: l.monthlyEmi,
        loanTerm: l.loanTerm,
        status: l.status,
        branch: l.branch
      }))
    };

    sendSuccess(res, report, 'Loan report generated');
  } catch (error) {
    sendError(res, error, 'Failed to generate loan report', 500);
  }
});

// Generate Collection Report
router.get('/collection-report', requireLogin, (req, res) => {
  try {
    const branch = req.query.branch || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    let transactions = global.db.transactions.filter(t => t.type === 'emi_collection');

    if (startDate) transactions = transactions.filter(t => new Date(t.collectionDate) >= startDate);
    if (endDate) transactions = transactions.filter(t => new Date(t.collectionDate) <= endDate);

    const totalCollected = transactions.reduce((sum, t) => sum + t.amount, 0);
    const staffWiseCollection = {};
    const modeWiseCollection = {};

    transactions.forEach(t => {
      staffWiseCollection[t.collectedBy] = (staffWiseCollection[t.collectedBy] || 0) + t.amount;
      modeWiseCollection[t.paymentMode] = (modeWiseCollection[t.paymentMode] || 0) + t.amount;
    });

    const report = {
      totalCollected,
      transactionCount: transactions.length,
      averageCollection: transactions.length > 0 ? Math.round(totalCollected / transactions.length) : 0,
      staffWiseCollection,
      modeWiseCollection,
      transactions: transactions.slice(0, 100)
    };

    sendSuccess(res, report, 'Collection report generated');
  } catch (error) {
    sendError(res, error, 'Failed to generate collection report', 500);
  }
});

// Generate Cash Book Report
router.get('/cash-book', requireLogin, (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    let transactions = global.db.wallet.transactions;

    if (startDate) transactions = transactions.filter(t => new Date(t.date) >= startDate);
    if (endDate) transactions = transactions.filter(t => new Date(t.date) <= endDate);

    const totalCredit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

    const report = {
      totalCredit,
      totalDebit,
      closingBalance: global.db.wallet.balance,
      transactionCount: transactions.length,
      transactions: transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 100)
    };

    sendSuccess(res, report, 'Cash book generated');
  } catch (error) {
    sendError(res, error, 'Failed to generate cash book', 500);
  }
});

// Generate Staff Performance Report
router.get('/staff-performance', requireAdmin, (req, res) => {
  try {
    const staffData = {};

    global.db.staff.forEach(staff => {
      const customersAdded = global.db.customers.filter(c => c.addedBy === staff.staffId).length;
      const loansCreated = global.db.loans.filter(l => l.appliedBy === staff.staffId).length;
      const collectionAmount = global.db.transactions
        .filter(t => t.collectedBy === staff.staffId && t.type === 'emi_collection')
        .reduce((sum, t) => sum + t.amount, 0);

      staffData[staff.staffId] = {
        name: staff.fullName,
        branch: staff.branch,
        designation: staff.designation,
        customersAdded,
        loansCreated,
        collectionAmount,
        performance: Math.round((customersAdded * 10 + loansCreated * 20 + collectionAmount / 100) / 3)
      };
    });

    sendSuccess(res, staffData, 'Staff performance report generated');
  } catch (error) {
    sendError(res, error, 'Failed to generate staff performance report', 500);
  }
});

export default router;
