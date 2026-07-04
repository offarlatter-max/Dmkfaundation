import express from 'express';
import { requireLogin, requireAdmin, requireStaffOrAdmin } from '../middleware/auth.js';
import { generateLoanId } from '../utils/idGenerator.js';
import { validateFormData } from '../utils/validation.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

const router = express.Router();

// Create Loan Application
router.post('/apply', requireStaffOrAdmin, (req, res) => {
  try {
    const {
      customerId,
      loanAmount,
      loanTerm,
      loanType,
      purpose,
      branch
    } = req.body;

    // Validation
    const errors = validateFormData(req.body, ['customerId', 'loanAmount', 'loanTerm', 'loanType', 'purpose', 'branch']);
    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Find customer
    const customer = global.db.customers.find(c => c.customerId === customerId);
    if (!customer) {
      return sendError(res, 'Customer not found', 'Customer not found', 404);
    }

    // Check if customer has pending loan
    const pendingLoan = global.db.loans.find(l => l.customerId === customer.id && l.status === 'pending');
    if (pendingLoan) {
      return sendError(res, 'Pending loan exists', 'Customer already has a pending loan application', 400);
    }

    const loanId = generateLoanId();
    const amount = parseFloat(loanAmount);
    const term = parseInt(loanTerm);
    const monthlyRate = 0.01; // 1% monthly interest
    const monthlyEmi = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);

    const newLoan = {
      id: Math.random().toString(36).substr(2, 9),
      loanId,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.mobileNumber,
      loanAmount: amount,
      loanTerm: term,
      loanType: loanType.trim(),
      purpose: purpose.trim(),
      branch: branch.trim(),
      monthlyEmi: Math.round(monthlyEmi),
      status: 'pending',
      appliedAt: new Date(),
      appliedBy: req.session.user.staffId || req.session.user.adminId,
      approvedAt: null,
      approvedBy: null,
      rejectionReason: null,
      startDate: null,
      endDate: null
    };

    global.db.loans.push(newLoan);

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Create Loan Application',
      details: { loanId, customerId, amount },
      timestamp: new Date()
    });

    sendSuccess(res, {
      loanId,
      customerId,
      loanAmount: amount,
      monthlyEmi: Math.round(monthlyEmi),
      loanTerm: term,
      status: 'pending',
      message: 'Loan application created successfully'
    }, 'Loan application created', 201);

  } catch (error) {
    sendError(res, error, 'Failed to create loan application', 500);
  }
});

// Get All Loans
router.get('/', requireLogin, (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const status = req.query.status || '';
    const branch = req.query.branch || '';

    let loans = global.db.loans;

    // Staff can only see loans from their branch
    if (req.session.user.role === 'staff') {
      loans = loans.filter(l => l.branch === req.session.user.branch);
    }

    if (search) {
      loans = loans.filter(l =>
        l.loanId.includes(search) ||
        l.customerName.toLowerCase().includes(search) ||
        l.customerId.includes(search)
      );
    }

    if (status) {
      loans = loans.filter(l => l.status === status);
    }

    if (branch) {
      loans = loans.filter(l => l.branch === branch);
    }

    const result = loans.map(l => ({
      id: l.id,
      loanId: l.loanId,
      customerName: l.customerName,
      loanAmount: l.loanAmount,
      monthlyEmi: l.monthlyEmi,
      loanTerm: l.loanTerm,
      status: l.status,
      appliedAt: l.appliedAt,
      branch: l.branch
    }));

    sendSuccess(res, result, 'Loans retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve loans', 500);
  }
});

// Get Loan by ID
router.get('/:loanId', requireLogin, (req, res) => {
  try {
    const loan = global.db.loans.find(l => l.loanId === req.params.loanId);
    if (!loan) {
      return sendError(res, 'Loan not found', 'Loan not found', 404);
    }

    sendSuccess(res, loan, 'Loan retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve loan', 500);
  }
});

// Approve Loan (Admin only)
router.post('/:loanId/approve', requireAdmin, (req, res) => {
  try {
    const { approvalNotes } = req.body;

    const loan = global.db.loans.find(l => l.loanId === req.params.loanId);
    if (!loan) {
      return sendError(res, 'Loan not found', 'Loan not found', 404);
    }

    if (loan.status !== 'pending') {
      return sendError(res, 'Invalid status', 'Only pending loans can be approved', 400);
    }

    loan.status = 'approved';
    loan.approvedAt = new Date();
    loan.approvedBy = req.session.user.adminId;
    loan.approvalNotes = approvalNotes || '';
    loan.startDate = new Date();
    loan.endDate = new Date(Date.now() + loan.loanTerm * 30 * 24 * 60 * 60 * 1000); // Approximate

    // Create EMI records
    const currentDate = new Date();
    for (let i = 1; i <= loan.loanTerm; i++) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      dueDate.setDate(1);

      global.db.emi.push({
        id: Math.random().toString(36).substr(2, 9),
        loanId: loan.id,
        loanNumber: loan.loanId,
        customerId: loan.customerId,
        emiNumber: i,
        dueDate,
        amountDue: loan.monthlyEmi,
        amountPaid: 0,
        status: 'pending',
        collectedBy: null,
        collectionDate: null,
        paymentMode: null
      });
    }

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Approve Loan',
      details: { loanId: req.params.loanId, amount: loan.loanAmount },
      timestamp: new Date()
    });

    sendSuccess(res, loan, 'Loan approved successfully');
  } catch (error) {
    sendError(res, error, 'Failed to approve loan', 500);
  }
});

// Reject Loan (Admin only)
router.post('/:loanId/reject', requireAdmin, (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return sendValidationError(res, ['Rejection reason is required']);
    }

    const loan = global.db.loans.find(l => l.loanId === req.params.loanId);
    if (!loan) {
      return sendError(res, 'Loan not found', 'Loan not found', 404);
    }

    if (loan.status !== 'pending') {
      return sendError(res, 'Invalid status', 'Only pending loans can be rejected', 400);
    }

    loan.status = 'rejected';
    loan.rejectionReason = rejectionReason.trim();
    loan.rejectedAt = new Date();
    loan.rejectedBy = req.session.user.adminId;

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Reject Loan',
      details: { loanId: req.params.loanId, reason: rejectionReason },
      timestamp: new Date()
    });

    sendSuccess(res, loan, 'Loan rejected successfully');
  } catch (error) {
    sendError(res, error, 'Failed to reject loan', 500);
  }
});

// Change Loan Status to Active
router.patch('/:loanId/activate', requireAdmin, (req, res) => {
  try {
    const loan = global.db.loans.find(l => l.loanId === req.params.loanId);
    if (!loan) {
      return sendError(res, 'Loan not found', 'Loan not found', 404);
    }

    if (loan.status !== 'approved') {
      return sendError(res, 'Invalid status', 'Only approved loans can be activated', 400);
    }

    loan.status = 'active';

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Activate Loan',
      details: { loanId: req.params.loanId },
      timestamp: new Date()
    });

    sendSuccess(res, loan, 'Loan activated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to activate loan', 500);
  }
});

export default router;
