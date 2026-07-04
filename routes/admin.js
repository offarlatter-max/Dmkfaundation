import express from 'express';
import bcryptjs from 'bcryptjs';
import { requireAdmin, logActivity } from '../middleware/auth.js';
import { generateAdminId } from '../utils/idGenerator.js';
import { validatePassword, validateEmail, validateFormData } from '../utils/validation.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

const router = express.Router();

// Initialize first admin if none exists
router.post('/initialize-admin', async (req, res) => {
  try {
    // Check if any admin exists
    if (global.db.admins.length > 0) {
      return sendError(res, 'Admin already exists', 'System already initialized', 400);
    }

    const { username, email, password, confirmPassword } = req.body;

    // Validation
    const errors = validateFormData(req.body, ['username', 'email', 'password', 'confirmPassword']);
    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    if (password !== confirmPassword) {
      return sendValidationError(res, ['Passwords do not match']);
    }

    if (!validateEmail(email)) {
      return sendValidationError(res, ['Invalid email format']);
    }

    if (!validatePassword(password)) {
      return sendValidationError(res, ['Password must be at least 8 characters long']);
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);
    const adminId = generateAdminId();

    const newAdmin = {
      id: Math.random().toString(36).substr(2, 9),
      adminId,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      isActive: true,
      createdAt: new Date(),
      passwordChangedAt: new Date(),
      loginAttempts: 0,
      lastLogin: null
    };

    global.db.admins.push(newAdmin);

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: newAdmin.id,
      username: newAdmin.username,
      action: 'Admin Account Created',
      details: { adminId, email, timestamp: new Date() },
      timestamp: new Date()
    });

    sendSuccess(res, {
      adminId,
      username,
      email,
      message: 'First admin account created successfully'
    }, 'Admin created', 201);

  } catch (error) {
    sendError(res, error, 'Failed to create admin', 500);
  }
});

// Get all admins (admin only)
router.get('/', requireAdmin, (req, res) => {
  try {
    const admins = global.db.admins.map(a => ({
      id: a.id,
      adminId: a.adminId,
      username: a.username,
      email: a.email,
      isActive: a.isActive,
      createdAt: a.createdAt,
      lastLogin: a.lastLogin
    }));
    sendSuccess(res, admins, 'Admins retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve admins', 500);
  }
});

// Get admin by ID
router.get('/:adminId', requireAdmin, (req, res) => {
  try {
    const admin = global.db.admins.find(a => a.adminId === req.params.adminId);
    if (!admin) {
      return sendError(res, 'Admin not found', 'Admin not found', 404);
    }

    sendSuccess(res, {
      id: admin.id,
      adminId: admin.adminId,
      username: admin.username,
      email: admin.email,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin
    }, 'Admin retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve admin', 500);
  }
});

// Update admin
router.put('/:adminId', requireAdmin, async (req, res) => {
  try {
    const { username, email, isActive } = req.body;

    const admin = global.db.admins.find(a => a.adminId === req.params.adminId);
    if (!admin) {
      return sendError(res, 'Admin not found', 'Admin not found', 404);
    }

    if (username) admin.username = username.trim();
    if (email) admin.email = email.toLowerCase().trim();
    if (isActive !== undefined) admin.isActive = isActive;
    admin.updatedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Update Admin',
      details: { updatedAdminId: req.params.adminId, changes: { username, email, isActive } },
      timestamp: new Date()
    });

    sendSuccess(res, admin, 'Admin updated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to update admin', 500);
  }
});

// Reset admin password (admin only)
router.post('/:adminId/reset-password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return sendValidationError(res, ['New password is required']);
    }

    if (!validatePassword(newPassword)) {
      return sendValidationError(res, ['Password must be at least 8 characters long']);
    }

    const admin = global.db.admins.find(a => a.adminId === req.params.adminId);
    if (!admin) {
      return sendError(res, 'Admin not found', 'Admin not found', 404);
    }

    const passwordHash = await bcryptjs.hash(newPassword, 10);
    admin.passwordHash = passwordHash;
    admin.passwordChangedAt = new Date();
    admin.loginAttempts = 0;

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Reset Admin Password',
      details: { targetAdminId: req.params.adminId },
      timestamp: new Date()
    });

    sendSuccess(res, {}, 'Admin password reset successfully');
  } catch (error) {
    sendError(res, error, 'Failed to reset password', 500);
  }
});

export default router;
