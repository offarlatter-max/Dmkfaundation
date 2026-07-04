import express from 'express';
import bcryptjs from 'bcryptjs';
import { requireAdmin, logActivity } from '../middleware/auth.js';
import { generateStaffId } from '../utils/idGenerator.js';
import { validatePassword, validateEmail, validatePhoneNumber, validateAadhaar, validatePAN, validateFormData } from '../utils/validation.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

const router = express.Router();

// Add Staff
router.post('/add', requireAdmin, async (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      email,
      aadhaarNumber,
      panNumber,
      address,
      branch,
      area,
      designation,
      joiningDate,
      password
    } = req.body;

    // Validation
    const errors = validateFormData(req.body, [
      'fullName', 'mobileNumber', 'email', 'address', 'branch', 'area', 'designation', 'password'
    ]);
    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Validate specific fields
    if (!validateEmail(email)) {
      return sendValidationError(res, ['Invalid email format']);
    }
    if (!validatePhoneNumber(mobileNumber)) {
      return sendValidationError(res, ['Invalid mobile number']);
    }
    if (aadhaarNumber && !validateAadhaar(aadhaarNumber)) {
      return sendValidationError(res, ['Invalid Aadhaar number']);
    }
    if (panNumber && !validatePAN(panNumber)) {
      return sendValidationError(res, ['Invalid PAN number']);
    }
    if (!validatePassword(password)) {
      return sendValidationError(res, ['Password must be at least 8 characters long']);
    }

    // Check if staff with same email or mobile already exists
    if (global.db.staff.find(s => s.email === email)) {
      return sendError(res, 'Email already in use', 'A staff member with this email already exists', 400);
    }
    if (global.db.staff.find(s => s.mobileNumber === mobileNumber)) {
      return sendError(res, 'Mobile number already in use', 'A staff member with this number already exists', 400);
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);
    const staffId = generateStaffId();

    const newStaff = {
      id: Math.random().toString(36).substr(2, 9),
      staffId,
      fullName: fullName.trim(),
      mobileNumber,
      email: email.toLowerCase().trim(),
      aadhaarNumber: aadhaarNumber?.trim() || null,
      panNumber: panNumber?.toUpperCase().trim() || null,
      address: address.trim(),
      branch: branch.trim(),
      area: area.trim(),
      designation: designation.trim(),
      joiningDate: new Date(joiningDate),
      status: 'active',
      passwordHash,
      photoUrl: null,
      createdAt: new Date(),
      createdBy: req.session.user.adminId
    };

    global.db.staff.push(newStaff);

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Add Staff',
      details: { staffId, staffName: fullName, branch },
      timestamp: new Date()
    });

    sendSuccess(res, {
      staffId,
      fullName,
      email,
      branch,
      area,
      designation,
      message: 'Staff member added successfully'
    }, 'Staff added', 201);

  } catch (error) {
    sendError(res, error, 'Failed to add staff', 500);
  }
});

// Get All Staff
router.get('/', requireAdmin, (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const branch = req.query.branch || '';
    const status = req.query.status || '';

    let staffList = global.db.staff;

    if (search) {
      staffList = staffList.filter(s =>
        s.fullName.toLowerCase().includes(search) ||
        s.staffId.includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.mobileNumber.includes(search)
      );
    }

    if (branch) {
      staffList = staffList.filter(s => s.branch === branch);
    }

    if (status) {
      staffList = staffList.filter(s => s.status === status);
    }

    const result = staffList.map(s => ({
      id: s.id,
      staffId: s.staffId,
      fullName: s.fullName,
      mobileNumber: s.mobileNumber,
      email: s.email,
      branch: s.branch,
      area: s.area,
      designation: s.designation,
      joiningDate: s.joiningDate,
      status: s.status,
      createdAt: s.createdAt
    }));

    sendSuccess(res, result, 'Staff list retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve staff list', 500);
  }
});

// Get Staff by ID
router.get('/:staffId', requireAdmin, (req, res) => {
  try {
    const staff = global.db.staff.find(s => s.staffId === req.params.staffId);
    if (!staff) {
      return sendError(res, 'Staff not found', 'Staff member not found', 404);
    }

    sendSuccess(res, {
      id: staff.id,
      staffId: staff.staffId,
      fullName: staff.fullName,
      mobileNumber: staff.mobileNumber,
      email: staff.email,
      aadhaarNumber: staff.aadhaarNumber,
      panNumber: staff.panNumber,
      address: staff.address,
      branch: staff.branch,
      area: staff.area,
      designation: staff.designation,
      joiningDate: staff.joiningDate,
      status: staff.status,
      createdAt: staff.createdAt
    }, 'Staff retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve staff', 500);
  }
});

// Edit Staff
router.put('/:staffId', requireAdmin, (req, res) => {
  try {
    const staff = global.db.staff.find(s => s.staffId === req.params.staffId);
    if (!staff) {
      return sendError(res, 'Staff not found', 'Staff member not found', 404);
    }

    const { fullName, mobileNumber, email, address, branch, area, designation } = req.body;

    if (fullName) staff.fullName = fullName.trim();
    if (mobileNumber) staff.mobileNumber = mobileNumber;
    if (email) staff.email = email.toLowerCase().trim();
    if (address) staff.address = address.trim();
    if (branch) staff.branch = branch.trim();
    if (area) staff.area = area.trim();
    if (designation) staff.designation = designation.trim();
    staff.updatedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Update Staff',
      details: { staffId: req.params.staffId, staffName: staff.fullName },
      timestamp: new Date()
    });

    sendSuccess(res, staff, 'Staff updated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to update staff', 500);
  }
});

// Delete Staff
router.delete('/:staffId', requireAdmin, (req, res) => {
  try {
    const index = global.db.staff.findIndex(s => s.staffId === req.params.staffId);
    if (index === -1) {
      return sendError(res, 'Staff not found', 'Staff member not found', 404);
    }

    const staff = global.db.staff[index];
    global.db.staff.splice(index, 1);

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Delete Staff',
      details: { staffId: req.params.staffId, staffName: staff.fullName },
      timestamp: new Date()
    });

    sendSuccess(res, {}, 'Staff deleted successfully');
  } catch (error) {
    sendError(res, error, 'Failed to delete staff', 500);
  }
});

// Activate Staff
router.patch('/:staffId/activate', requireAdmin, (req, res) => {
  try {
    const staff = global.db.staff.find(s => s.staffId === req.params.staffId);
    if (!staff) {
      return sendError(res, 'Staff not found', 'Staff member not found', 404);
    }

    staff.status = 'active';
    staff.updatedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Activate Staff',
      details: { staffId: req.params.staffId, staffName: staff.fullName },
      timestamp: new Date()
    });

    sendSuccess(res, staff, 'Staff activated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to activate staff', 500);
  }
});

// Deactivate Staff
router.patch('/:staffId/deactivate', requireAdmin, (req, res) => {
  try {
    const staff = global.db.staff.find(s => s.staffId === req.params.staffId);
    if (!staff) {
      return sendError(res, 'Staff not found', 'Staff member not found', 404);
    }

    staff.status = 'inactive';
    staff.updatedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Deactivate Staff',
      details: { staffId: req.params.staffId, staffName: staff.fullName },
      timestamp: new Date()
    });

    sendSuccess(res, staff, 'Staff deactivated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to deactivate staff', 500);
  }
});

// Reset Staff Password
router.post('/:staffId/reset-password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return sendValidationError(res, ['New password is required']);
    }

    if (!validatePassword(newPassword)) {
      return sendValidationError(res, ['Password must be at least 8 characters long']);
    }

    const staff = global.db.staff.find(s => s.staffId === req.params.staffId);
    if (!staff) {
      return sendError(res, 'Staff not found', 'Staff member not found', 404);
    }

    const passwordHash = await bcryptjs.hash(newPassword, 10);
    staff.passwordHash = passwordHash;
    staff.passwordChangedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Reset Staff Password',
      details: { staffId: req.params.staffId, staffName: staff.fullName },
      timestamp: new Date()
    });

    sendSuccess(res, {}, 'Staff password reset successfully');
  } catch (error) {
    sendError(res, error, 'Failed to reset password', 500);
  }
});

// Get Staff Performance
router.get('/:staffId/performance', requireAdmin, (req, res) => {
  try {
    const staff = global.db.staff.find(s => s.staffId === req.params.staffId);
    if (!staff) {
      return sendError(res, 'Staff not found', 'Staff member not found', 404);
    }

    const customersAdded = global.db.customers.filter(c => c.addedBy === staff.staffId).length;
    const loansCreated = global.db.loans.filter(l => l.createdBy === staff.staffId).length;
    const collectionAmount = global.db.emi
      .filter(e => e.collectedBy === staff.staffId)
      .reduce((sum, e) => sum + (e.amountPaid || 0), 0);

    const performance = {
      staffId: staff.staffId,
      fullName: staff.fullName,
      customersAdded,
      loansCreated,
      collectionAmount,
      branch: staff.branch,
      area: staff.area
    };

    sendSuccess(res, performance, 'Staff performance retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve performance', 500);
  }
});

export default router;
