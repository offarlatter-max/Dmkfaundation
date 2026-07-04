import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// Get System Settings
router.get('/', requireAdmin, (req, res) => {
  try {
    const settings = {
      systemName: 'DMK Foundation - Loan Management System',
      version: '1.0.0',
      currency: 'INR',
      interestRate: '1% per month',
      businessHours: '9 AM - 6 PM',
      supportEmail: 'support@dmkfoundation.com',
      phoneNumber: '+91-XXXXXXXXXX'
    };

    sendSuccess(res, settings, 'Settings retrieved');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve settings', 500);
  }
});

// Update System Settings (Admin only)
router.put('/update', requireAdmin, (req, res) => {
  try {
    const { interestRate, businessHours, supportEmail, phoneNumber } = req.body;

    const updatedSettings = {
      interestRate: interestRate || '1% per month',
      businessHours: businessHours || '9 AM - 6 PM',
      supportEmail: supportEmail || 'support@dmkfoundation.com',
      phoneNumber: phoneNumber || '+91-XXXXXXXXXX'
    };

    // Log activity
    global.db.activityLog.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: req.session.user.id,
      username: req.session.user.username,
      action: 'Update System Settings',
      details: updatedSettings,
      timestamp: new Date()
    });

    sendSuccess(res, updatedSettings, 'Settings updated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to update settings', 500);
  }
});

export default router;
