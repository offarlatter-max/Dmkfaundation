import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { generateBranchId } from '../utils/idGenerator.js';
import { validateEmail, validatePhoneNumber, validateFormData } from '../utils/validation.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

const router = express.Router();

// Add Branch
router.post('/add', requireAdmin, (req, res) => {
  try {
    const { branchName, branchManager, address, mobileNumber, email } = req.body;

    // Validation
    const errors = validateFormData(req.body, ['branchName', 'branchManager', 'address', 'mobileNumber', 'email']);
    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    if (!validateEmail(email)) {
      return sendValidationError(res, ['Invalid email format']);
    }
    if (!validatePhoneNumber(mobileNumber)) {
      return sendValidationError(res, ['Invalid mobile number']);
    }

    // Check if branch already exists
    if (global.db.branches.find(b => b.email === email)) {
      return sendError(res, 'Email already in use', 'A branch with this email already exists', 400);
    }

    const branchId = generateBranchId();

    const newBranch = {
      id: Math.random().toString(36).substr(2, 9),
      branchId,
      branchName: branchName.trim(),
      branchManager: branchManager.trim(),
      address: address.trim(),
      mobileNumber,
      email: email.toLowerCase().trim(),
      createdAt: new Date(),
      createdBy: req.session.user.adminId
    };

    global.db.branches.push(newBranch);

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Add Branch',
      details: { branchId, branchName },
      timestamp: new Date()
    });

    sendSuccess(res, {
      branchId,
      branchName,
      branchManager,
      message: 'Branch added successfully'
    }, 'Branch added', 201);

  } catch (error) {
    sendError(res, error, 'Failed to add branch', 500);
  }
});

// Get All Branches
router.get('/', requireAdmin, (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';

    let branches = global.db.branches;

    if (search) {
      branches = branches.filter(b =>
        b.branchName.toLowerCase().includes(search) ||
        b.branchId.includes(search) ||
        b.branchManager.toLowerCase().includes(search)
      );
    }

    const result = branches.map(b => ({
      id: b.id,
      branchId: b.branchId,
      branchName: b.branchName,
      branchManager: b.branchManager,
      address: b.address,
      mobileNumber: b.mobileNumber,
      email: b.email,
      createdAt: b.createdAt
    }));

    sendSuccess(res, result, 'Branches retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve branches', 500);
  }
});

// Get Branch by ID
router.get('/:branchId', requireAdmin, (req, res) => {
  try {
    const branch = global.db.branches.find(b => b.branchId === req.params.branchId);
    if (!branch) {
      return sendError(res, 'Branch not found', 'Branch not found', 404);
    }

    sendSuccess(res, branch, 'Branch retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve branch', 500);
  }
});

// Edit Branch
router.put('/:branchId', requireAdmin, (req, res) => {
  try {
    const branch = global.db.branches.find(b => b.branchId === req.params.branchId);
    if (!branch) {
      return sendError(res, 'Branch not found', 'Branch not found', 404);
    }

    const { branchName, branchManager, address, mobileNumber, email } = req.body;

    if (branchName) branch.branchName = branchName.trim();
    if (branchManager) branch.branchManager = branchManager.trim();
    if (address) branch.address = address.trim();
    if (mobileNumber) branch.mobileNumber = mobileNumber;
    if (email) branch.email = email.toLowerCase().trim();
    branch.updatedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Update Branch',
      details: { branchId: req.params.branchId, branchName: branch.branchName },
      timestamp: new Date()
    });

    sendSuccess(res, branch, 'Branch updated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to update branch', 500);
  }
});

// Delete Branch
router.delete('/:branchId', requireAdmin, (req, res) => {
  try {
    const index = global.db.branches.findIndex(b => b.branchId === req.params.branchId);
    if (index === -1) {
      return sendError(res, 'Branch not found', 'Branch not found', 404);
    }

    const branch = global.db.branches[index];
    global.db.branches.splice(index, 1);

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Delete Branch',
      details: { branchId: req.params.branchId, branchName: branch.branchName },
      timestamp: new Date()
    });

    sendSuccess(res, {}, 'Branch deleted successfully');
  } catch (error) {
    sendError(res, error, 'Failed to delete branch', 500);
  }
});

// Get Branch Report
router.get('/:branchId/report', requireAdmin, (req, res) => {
  try {
    const branch = global.db.branches.find(b => b.branchId === req.params.branchId);
    if (!branch) {
      return sendError(res, 'Branch not found', 'Branch not found', 404);
    }

    const staffCount = global.db.staff.filter(s => s.branch === branch.branchName).length;
    const customersCount = global.db.customers.filter(c => c.branch === branch.branchName).length;
    const activeLoans = global.db.loans.filter(l => l.branch === branch.branchName && l.status === 'active').length;
    const totalCollection = global.db.emi
      .filter(e => {
        const loan = global.db.loans.find(l => l.id === e.loanId);
        return loan && loan.branch === branch.branchName;
      })
      .reduce((sum, e) => sum + (e.amountPaid || 0), 0);

    const report = {
      branchId: branch.branchId,
      branchName: branch.branchName,
      branchManager: branch.branchManager,
      staffCount,
      customersCount,
      activeLoans,
      totalCollection
    };

    sendSuccess(res, report, 'Branch report retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve branch report', 500);
  }
});

export default router;
