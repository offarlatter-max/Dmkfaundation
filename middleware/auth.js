export const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
};

export const requireStaffOrAdmin = (req, res, next) => {
  if (!req.session.user || !['admin', 'staff'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Forbidden. Staff or Admin access required.' });
  }
  next();
};

export const logActivity = (action, details = {}) => {
  return (req, res, next) => {
    if (req.session.user) {
      global.db.activityLog.push({
        id: crypto.randomUUID(),
        userId: req.session.user.id,
        username: req.session.user.username,
        action,
        details,
        timestamp: new Date(),
        ipAddress: req.ip
      });
    }
    next();
  };
};
