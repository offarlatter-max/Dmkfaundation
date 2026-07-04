import express from 'express';
import bcryptjs from 'bcryptjs';
import { generateAdminId, generateStaffId } from '../utils/idGenerator.js';
import { validatePassword, validateFormData, sanitizeInput } from '../utils/validation.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';
import { requireAdmin, logActivity } from '../middleware/auth.js';

const router = express.Router();

// Admin Login
router.post('/admin-login', async (req, res) => {
  try {
    const { adminId, password, rememberMe } = req.body;

    // Validation
    if (!adminId || !password) {
      return sendValidationError(res, ['Admin ID and Password are required']);
    }

    // Find admin
    const admin = global.db.admins.find(a => a.adminId === adminId);
    if (!admin) {
      return sendError(res, 'Admin not found', 'Invalid Admin ID or Password', 401);
    }

    // Check if admin is active
    if (!admin.isActive) {
      return sendError(res, 'Account is inactive', 'Contact administrator', 403);
    }

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      return sendError(res, 'Password mismatch', 'Invalid Admin ID or Password', 401);
    }

    // Create session
    req.session.user = {
      id: admin.id,
      adminId: admin.adminId,
      username: admin.username,
      email: admin.email,
      role: 'admin',
      loginTime: new Date()
    };

    // Set session expiry if rememberMe is true
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: admin.id,
      username: admin.username,
      action: 'Admin Login',
      details: { adminId, timestamp: new Date() },
      timestamp: new Date()
    });

    sendSuccess(res, {
      adminId: admin.adminId,
      username: admin.username,
      email: admin.email,
      sessionId: req.sessionID
    }, 'Login successful', 200);

  } catch (error) {
    sendError(res, error, 'Login failed', 500);
  }
});

// Staff Login
router.post('/staff-login', async (req, res) => {
  try {
    const { staffId, password } = req.body;

    // Validation
    if (!staffId || !password) {
      return sendValidationError(res, ['Staff ID and Password are required']);
    }

    // Find staff
    const staff = global.db.staff.find(s => s.staffId === staffId);
    if (!staff) {
      return sendError(res, 'Staff not found', 'Invalid Staff ID or Password', 401);
    }

    // Check if staff is active
    if (staff.status !== 'active') {
      return sendError(res, 'Account is inactive', 'Contact administrator', 403);
    }

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, staff.passwordHash);
    if (!passwordMatch) {
      return sendError(res, 'Password mismatch', 'Invalid Staff ID or Password', 401);
    }

    // Create session
    req.session.user = {
      id: staff.id,
      staffId: staff.staffId,
      username: staff.fullName,
      email: staff.email,
      role: 'staff',
      branch: staff.branch,
      area: staff.area,
      loginTime: new Date()
    };

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: staff.id,
      username: staff.fullName,
      action: 'Staff Login',
      details: { staffId, timestamp: new Date() },
      timestamp: new Date()
    });

    sendSuccess(res, {
      staffId: staff.staffId,
      username: staff.fullName,
      email: staff.email,
      branch: staff.branch,
      area: staff.area,
      sessionId: req.sessionID
    }, 'Login successful', 200);

  } catch (error) {
    sendError(res, error, 'Login failed', 500);
  }
});

// Get current session
router.get('/current-session', (req, res) => {
  if (!req.session.user) {
    return sendError(res, 'No active session', 'Please login', 401);
  }
  sendSuccess(res, req.session.user, 'Session retrieved');
});

// Logout
router.post('/logout', (req, res) => {
  const username = req.session.user?.username || 'Unknown';
  const userId = req.session.user?.id;

  req.session.destroy((err) => {
    if (err) {
      return sendError(res, err, 'Logout failed', 500);
    }

    if (userId) {
      global.db.activityLog.push({
        id: Math.random().toString(36).substr(2, 9),
        userId,
        username,
        action: 'Logout',
        details: { timestamp: new Date() },
        timestamp: new Date()
      });
    }

    sendSuccess(res, {}, 'Logged out successfully');
  });
});

// Change Password
router.post('/change-password', async (req, res) => {
  try {
    if (!req.session.user) {
      return sendError(res, 'No active session', 'Please login first', 401);
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validation
    const errors = validateFormData(req.body, ['oldPassword', 'newPassword', 'confirmPassword']);
    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    if (newPassword !== confirmPassword) {
      return sendValidationError(res, ['Passwords do not match']);
    }

    if (!validatePassword(newPassword)) {
      return sendValidationError(res, ['Password must be at least 8 characters long']);
    }

    // Find user based on role
    let user;
    if (req.session.user.role === 'admin') {
      user = global.db.admins.find(a => a.id === req.session.user.id);
    } else {
      user = global.db.staff.find(s => s.id === req.session.user.id);
    }

    if (!user) {
      return sendError(res, 'User not found', 'User record not found', 404);
    }

    // Verify old password
    const passwordMatch = await bcryptjs.compare(oldPassword, user.passwordHash);
    if (!passwordMatch) {
      return sendError(res, 'Old password incorrect', 'Old password does not match', 400);
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    user.passwordChangedAt = new Date();

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: req.session.user.username,
      action: 'Change Password',
      details: { timestamp: new Date() },
      timestamp: new Date()
    });

    sendSuccess(res, {}, 'Password changed successfully');

  } catch (error) {
    sendError(res, error, 'Failed to change password', 500);
  }
});

// Forgot Password (Send reset link - in production)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return sendValidationError(res, ['Email and role are required']);
    }

    let user;
    if (role === 'admin') {
      user = global.db.admins.find(a => a.email === email);
    } else if (role === 'staff') {
      user = global.db.staff.find(s => s.email === email);
    }

    if (!user) {
      // Don't reveal if email exists for security
      return sendSuccess(res, {}, 'If an account exists, a reset link has been sent');
    }

    // Generate reset token (in production, use JWT)
    const resetToken = Math.random().toString(36).substr(2) + Date.now().toString(36);
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username || user.fullName,
      action: 'Forgot Password Request',
      details: { email, timestamp: new Date() },
      timestamp: new Date()
    });

    sendSuccess(res, { resetToken }, 'Reset link sent to your email (dev mode: token provided)');

  } catch (error) {
    sendError(res, error, 'Failed to process forgot password', 500);
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return sendValidationError(res, ['Reset token, new password, and confirmation are required']);
    }

    if (newPassword !== confirmPassword) {
      return sendValidationError(res, ['Passwords do not match']);
    }

    if (!validatePassword(newPassword)) {
      return sendValidationError(res, ['Password must be at least 8 characters long']);
    }

    // Find user with valid reset token
    let user;
    let isAdmin = true;
    user = global.db.admins.find(a => a.resetToken === resetToken && a.resetTokenExpiry > new Date());
    if (!user) {
      isAdmin = false;
      user = global.db.staff.find(s => s.resetToken === resetToken && s.resetTokenExpiry > new Date());
    }

    if (!user) {
      return sendError(res, 'Invalid or expired reset token', 'Reset token is invalid or has expired', 400);
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    user.passwordChangedAt = new Date();
    user.resetToken = null;
    user.resetTokenExpiry = null;

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username || user.fullName,
      action: 'Reset Password',
      details: { timestamp: new Date() },
      timestamp: new Date()
    });

    sendSuccess(res, {}, 'Password reset successfully. Please login with your new password');

  } catch (error) {
    sendError(res, error, 'Failed to reset password', 500);
  }
});

export default router;
