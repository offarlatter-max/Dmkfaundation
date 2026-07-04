import express from 'express';
import { requireLogin, requireAdmin, logActivity } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// Get Dashboard Data
router.get('/stats', requireLogin, (req, res) => {
  try {
    const stats = {
      totalCustomers: global.db.customers.length,
      totalStaff: global.db.staff.length,
      totalBranches: global.db.branches.length,
      pendingLoans: global.db.loans.filter(l => l.status === 'pending').length,
      approvedLoans: global.db.loans.filter(l => l.status === 'approved').length,
      rejectedLoans: global.db.loans.filter(l => l.status === 'rejected').length,
      activeLoans: global.db.loans.filter(l => l.status === 'active').length,
      closedLoans: global.db.loans.filter(l => l.status === 'closed').length,
      todayCollection: calculateTodayCollection(),
      monthlyCollection: calculateMonthlyCollection(),
      outstandingBalance: calculateOutstandingBalance(),
      walletBalance: global.db.wallet.balance
    };
    sendSuccess(res, stats, 'Dashboard stats retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve dashboard stats', 500);
  }
});

// Get Recent Activities
router.get('/activities', requireLogin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = global.db.activityLog
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
      .map(a => ({
        id: a.id,
        username: a.username,
        action: a.action,
        details: a.details,
        timestamp: a.timestamp
      }));
    sendSuccess(res, activities, 'Activities retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve activities', 500);
  }
});

// Get Collection Analytics
router.get('/collection-analytics', requireLogin, (req, res) => {
  try {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    
    const dailyCollection = {};
    global.db.emi
      .filter(e => {
        const eDate = new Date(e.collectionDate);
        return eDate.getMonth() === month && eDate.getFullYear() === year;
      })
      .forEach(e => {
        const date = new Date(e.collectionDate).toLocaleDateString();
        dailyCollection[date] = (dailyCollection[date] || 0) + (e.amountPaid || 0);
      });

    const analytics = {
      totalCollected: calculateMonthlyCollection(),
      dailyBreakdown: dailyCollection,
      staffWiseCollection: getStaffWiseCollection(),
      branchWiseCollection: getBranchWiseCollection()
    };
    sendSuccess(res, analytics, 'Collection analytics retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve analytics', 500);
  }
});

// Get Loan Status Distribution
router.get('/loan-distribution', requireLogin, (req, res) => {
  try {
    const distribution = {
      pending: global.db.loans.filter(l => l.status === 'pending').length,
      approved: global.db.loans.filter(l => l.status === 'approved').length,
      rejected: global.db.loans.filter(l => l.status === 'rejected').length,
      active: global.db.loans.filter(l => l.status === 'active').length,
      closed: global.db.loans.filter(l => l.status === 'closed').length
    };
    sendSuccess(res, distribution, 'Loan distribution retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve loan distribution', 500);
  }
});

// Helper Functions
function calculateTodayCollection() {
  const today = new Date().toLocaleDateString();
  return global.db.emi
    .filter(e => new Date(e.collectionDate).toLocaleDateString() === today)
    .reduce((sum, e) => sum + (e.amountPaid || 0), 0);
}

function calculateMonthlyCollection() {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  return global.db.emi
    .filter(e => {
      const eDate = new Date(e.collectionDate);
      return eDate.getMonth() === month && eDate.getFullYear() === year;
    })
    .reduce((sum, e) => sum + (e.amountPaid || 0), 0);
}

function calculateOutstandingBalance() {
  return global.db.emi
    .filter(e => e.status === 'pending' || e.status === 'overdue')
    .reduce((sum, e) => sum + (e.amountDue - (e.amountPaid || 0)), 0);
}

function getStaffWiseCollection() {
  const collection = {};
  global.db.emi.forEach(e => {
    if (e.collectedBy) {
      collection[e.collectedBy] = (collection[e.collectedBy] || 0) + (e.amountPaid || 0);
    }
  });
  return collection;
}

function getBranchWiseCollection() {
  const collection = {};
  global.db.emi.forEach(e => {
    const loan = global.db.loans.find(l => l.id === e.loanId);
    if (loan) {
      const branch = loan.branch || 'Unknown';
      collection[branch] = (collection[branch] || 0) + (e.amountPaid || 0);
    }
  });
  return collection;
}

export default router;
