import express from 'express';
import { requireLogin, requireStaffOrAdmin } from '../middleware/auth.js';
import { generateCustomerId } from '../utils/idGenerator.js';
import { validateEmail, validatePhoneNumber, validateAadhaar, validateFormData } from '../utils/validation.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

const router = express.Router();

// Add Customer
router.post('/add', requireStaffOrAdmin, (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      email,
      aadhaarNumber,
      address,
      city,
      state,
      pincode,
      branch,
      annualIncome,
      occupation
    } = req.body;

    // Validation
    const errors = validateFormData(req.body, [
      'fullName', 'mobileNumber', 'email', 'address', 'city', 'branch'
    ]);
    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    if (!validateEmail(email)) {
      return sendValidationError(res, ['Invalid email format']);
    }
    if (!validatePhoneNumber(mobileNumber)) {
      return sendValidationError(res, ['Invalid mobile number']);
    }
    if (aadhaarNumber && !validateAadhaar(aadhaarNumber)) {
      return sendValidationError(res, ['Invalid Aadhaar number']);
    }

    // Check if customer already exists
    if (global.db.customers.find(c => c.email === email)) {
      return sendError(res, 'Email already in use', 'Customer with this email already exists', 400);
    }

    const customerId = generateCustomerId();

    const newCustomer = {
      id: Math.random().toString(36).substr(2, 9),
      customerId,
      fullName: fullName.trim(),
      mobileNumber,
      email: email.toLowerCase().trim(),
      aadhaarNumber: aadhaarNumber?.trim() || null,
      address: address.trim(),
      city: city?.trim() || '',
      state: state?.trim() || '',
      pincode: pincode?.trim() || '',
      branch: branch.trim(),
      annualIncome: parseFloat(annualIncome) || 0,
      occupation: occupation?.trim() || '',
      status: 'active',
      addedBy: req.session.user.staffId || req.session.user.adminId,
      createdAt: new Date(),
      documents: []
    };

    global.db.customers.push(newCustomer);

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Add Customer',
      details: { customerId, customerName: fullName, branch },
      timestamp: new Date()
    });

    sendSuccess(res, {
      customerId,
      fullName,
      email,
      mobileNumber,
      branch,
      message: 'Customer added successfully'
    }, 'Customer added', 201);

  } catch (error) {
    sendError(res, error, 'Failed to add customer', 500);
  }
});

// Get All Customers
router.get('/', requireStaffOrAdmin, (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const branch = req.query.branch || '';
    const status = req.query.status || '';

    let customers = global.db.customers;

    // Staff can only see customers from their branch
    if (req.session.user.role === 'staff') {
      customers = customers.filter(c => c.branch === req.session.user.branch);
    }

    if (search) {
      customers = customers.filter(c =>
        c.fullName.toLowerCase().includes(search) ||
        c.customerId.includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.mobileNumber.includes(search)
      );
    }

    if (branch) {
      customers = customers.filter(c => c.branch === branch);
    }

    if (status) {
      customers = customers.filter(c => c.status === status);
    }

    const result = customers.map(c => ({
      id: c.id,
      customerId: c.customerId,
      fullName: c.fullName,
      mobileNumber: c.mobileNumber,
      email: c.email,
      address: c.address,
      city: c.city,
      branch: c.branch,
      annualIncome: c.annualIncome,
      status: c.status,
      createdAt: c.createdAt
    }));

    sendSuccess(res, result, 'Customers retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve customers', 500);
  }
});

// Get Customer by ID
router.get('/:customerId', requireStaffOrAdmin, (req, res) => {
  try {
    const customer = global.db.customers.find(c => c.customerId === req.params.customerId);
    if (!customer) {
      return sendError(res, 'Customer not found', 'Customer not found', 404);
    }

    // Staff can only see customers from their branch
    if (req.session.user.role === 'staff' && customer.branch !== req.session.user.branch) {
      return sendError(res, 'Access denied', 'You can only view customers from your branch', 403);
    }

    const loans = global.db.loans.filter(l => l.customerId === customer.id);

    sendSuccess(res, {
      ...customer,
      loansCount: loans.length,
      activeLoans: loans.filter(l => l.status === 'active').length
    }, 'Customer retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve customer', 500);
  }
});

// Edit Customer
router.put('/:customerId', requireStaffOrAdmin, (req, res) => {
  try {
    const customer = global.db.customers.find(c => c.customerId === req.params.customerId);
    if (!customer) {
      return sendError(res, 'Customer not found', 'Customer not found', 404);
    }

    const { fullName, mobileNumber, email, address, city, state, pincode, annualIncome, occupation, status } = req.body;

    if (fullName) customer.fullName = fullName.trim();
    if (mobileNumber) customer.mobileNumber = mobileNumber;
    if (email) customer.email = email.toLowerCase().trim();
    if (address) customer.address = address.trim();
    if (city) customer.city = city.trim();
    if (state) customer.state = state.trim();
    if (pincode) customer.pincode = pincode.trim();
    if (annualIncome) customer.annualIncome = parseFloat(annualIncome);
    if (occupation) customer.occupation = occupation.trim();
    if (status) customer.status = status;
    customer.updatedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Update Customer',
      details: { customerId: req.params.customerId, customerName: customer.fullName },
      timestamp: new Date()
    });

    sendSuccess(res, customer, 'Customer updated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to update customer', 500);
  }
});

// Upload Customer Document
router.post('/:customerId/upload-document', requireStaffOrAdmin, (req, res) => {
  try {
    const { documentType, documentUrl } = req.body;

    const customer = global.db.customers.find(c => c.customerId === req.params.customerId);
    if (!customer) {
      return sendError(res, 'Customer not found', 'Customer not found', 404);
    }

    if (!documentType || !documentUrl) {
      return sendValidationError(res, ['Document type and URL are required']);
    }

    customer.documents.push({
      id: Math.random().toString(36).substr(2, 9),
      type: documentType,
      url: documentUrl,
      uploadedAt: new Date(),
      uploadedBy: req.session.user.username
    });

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Upload Document',
      details: { customerId: req.params.customerId, documentType },
      timestamp: new Date()
    });

    sendSuccess(res, customer.documents, 'Document uploaded successfully');
  } catch (error) {
    sendError(res, error, 'Failed to upload document', 500);
  }
});

// Get Customer Documents
router.get('/:customerId/documents', requireStaffOrAdmin, (req, res) => {
  try {
    const customer = global.db.customers.find(c => c.customerId === req.params.customerId);
    if (!customer) {
      return sendError(res, 'Customer not found', 'Customer not found', 404);
    }

    sendSuccess(res, customer.documents, 'Customer documents retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve documents', 500);
  }
});

// Deactivate Customer
router.patch('/:customerId/deactivate', requireStaffOrAdmin, (req, res) => {
  try {
    const customer = global.db.customers.find(c => c.customerId === req.params.customerId);
    if (!customer) {
      return sendError(res, 'Customer not found', 'Customer not found', 404);
    }

    customer.status = 'inactive';
    customer.updatedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Deactivate Customer',
      details: { customerId: req.params.customerId, customerName: customer.fullName },
      timestamp: new Date()
    });

    sendSuccess(res, customer, 'Customer deactivated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to deactivate customer', 500);
  }
});

export default router;
