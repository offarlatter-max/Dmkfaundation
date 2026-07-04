import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dmk-secret-key-2026',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// In-memory database (replace with MongoDB in production)
global.db = {
  admins: [],
  staff: [],
  branches: [],
  customers: [],
  loans: [],
  emi: [],
  transactions: [],
  activityLog: [],
  wallet: { balance: 0, transactions: [] }
};

// Import routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import staffRoutes from './routes/staff.js';
import branchRoutes from './routes/branch.js';
import customerRoutes from './routes/customer.js';
import loanRoutes from './routes/loan.js';
import emiRoutes from './routes/emi.js';
import walletRoutes from './routes/wallet.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/branch', branchRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Serve main page
app.get('/', (req, res) => {
  if (req.session.user) {
    res.sendFile(join(__dirname, 'public', 'dashboard.html'));
  } else {
    res.sendFile(join(__dirname, 'public', 'login.html'));
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 DMK Foundation Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`🔐 Login: http://localhost:${PORT}\n`);
});
