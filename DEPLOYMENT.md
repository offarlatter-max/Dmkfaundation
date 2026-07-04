# DMK Foundation - Loan Management System

**Production Deployment Guide**

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Git installed

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/offarlatter-max/Dmkfaundation.git
   cd Dmkfaundation
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```
   PORT=5000
   NODE_ENV=production
   SESSION_SECRET=your_secure_secret_key_here
   JWT_SECRET=your_jwt_secret_here
   DATABASE_URL=mongodb://localhost:27017/dmk_foundation
   ```

4. **Start the Server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

5. **Access the Application**
   - Open browser: `http://localhost:5000`
   - You'll be redirected to login page
   - Create first admin account

## 📋 First Time Setup

### Step 1: Initialize Admin Account
1. Click "Initialize Admin" link on login page
2. Fill in admin details:
   - Username: Your name
   - Email: admin@dmkfoundation.com
   - Password: Strong password (8+ characters)
3. Submit to create first admin account

### Step 2: Add Branches
1. Login with admin credentials
2. Navigate to "Branch Management"
3. Click "Add Branch"
4. Fill branch details (Name, Manager, Address, etc.)

### Step 3: Add Staff
1. Go to "Staff Management"
2. Click "Add Staff"
3. Assign staff to branches and areas
4. Set designations (Manager, Officer, Executive, etc.)

### Step 4: Add Customers
1. Staff/Admin can add customers from "Customer Management"
2. Fill customer profile with KYC details
3. Upload required documents

### Step 5: Create Loan Applications
1. Go to "Loan Management"
2. Click "Create Loan"
3. Select customer and fill loan details
4. Admin approves/rejects in Loan Management
5. Loan automatically moves to EMI tracking

## 📊 Key Modules

### Dashboard
- Real-time statistics
- Loan status overview
- Collection analytics
- Recent activities
- Outstanding balance tracking

### Staff Management
- Add/Edit/Delete staff
- Activate/Deactivate accounts
- Reset passwords
- View performance metrics
- Assign branch and area

### Branch Management
- Create and manage branches
- Branch reports
- Staff allocation
- Collection tracking by branch

### Customer Management
- Customer registration
- Document upload
- Profile management
- Status tracking

### Loan Management
- Loan application creation
- Admin approval workflow
- EMI schedule generation
- Loan activation
- Status tracking (Pending, Approved, Active, Closed, Rejected)

### EMI Management
- Track monthly EMI payments
- Payment collection
- Overdue management
- Payment mode recording
- Collection reports

### Wallet Management
- Central fund management
- Add/Debit operations
- Transaction history
- Balance tracking

### Reports
- Loan reports with analytics
- Collection reports
- Cash book
- Staff performance reports
- Custom date range filtering

## 🔐 Admin Only Features

- Staff Management (Add/Delete/Reset Password)
- Loan Approval/Rejection
- Wallet Management
- System Settings
- View All Reports

## 👤 Staff Features

- Add Customers
- Create Loan Applications
- Upload Documents
- Update EMI Collection
- View Assigned Customers

## 📱 API Endpoints

### Authentication
```
POST /api/auth/admin-login
POST /api/auth/staff-login
POST /api/auth/logout
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/activities
GET /api/dashboard/collection-analytics
GET /api/dashboard/loan-distribution
```

### Staff
```
POST /api/staff/add
GET /api/staff
GET /api/staff/:staffId
PUT /api/staff/:staffId
DELETE /api/staff/:staffId
PATCH /api/staff/:staffId/activate
PATCH /api/staff/:staffId/deactivate
POST /api/staff/:staffId/reset-password
GET /api/staff/:staffId/performance
```

### Branch
```
POST /api/branch/add
GET /api/branch
GET /api/branch/:branchId
PUT /api/branch/:branchId
DELETE /api/branch/:branchId
GET /api/branch/:branchId/report
```

### Customer
```
POST /api/customer/add
GET /api/customer
GET /api/customer/:customerId
PUT /api/customer/:customerId
POST /api/customer/:customerId/upload-document
GET /api/customer/:customerId/documents
PATCH /api/customer/:customerId/deactivate
```

### Loan
```
POST /api/loan/apply
GET /api/loan
GET /api/loan/:loanId
POST /api/loan/:loanId/approve
POST /api/loan/:loanId/reject
PATCH /api/loan/:loanId/activate
```

### EMI
```
GET /api/emi
GET /api/emi/:emiId
POST /api/emi/collect/:emiId
GET /api/emi/loan/:loanId
GET /api/emi/status/overdue
```

### Wallet
```
GET /api/wallet/balance
GET /api/wallet/transactions
POST /api/wallet/add-funds
POST /api/wallet/debit
```

### Reports
```
GET /api/reports/loan-report
GET /api/reports/collection-report
GET /api/reports/cash-book
GET /api/reports/staff-performance
```

## 🛠️ Configuration

### Environment Variables
```bash
PORT                    # Server port (default: 5000)
NODE_ENV                # development or production
SESSION_SECRET          # Session encryption key
JWT_SECRET              # JWT token secret
DATABASE_URL            # MongoDB connection string
```

### Session Configuration
- Timeout: 24 hours (default)
- Remember Me: 30 days
- Secure cookies in production
- HTTPOnly flag enabled

## 📈 Performance Optimization

1. **Enable Compression**
   ```javascript
   app.use(compression());
   ```

2. **Use Connection Pooling**
   - MongoDB connection pool: 10-100 connections

3. **Implement Caching**
   - Cache dashboard stats
   - Cache branch and staff lists

4. **Database Indexing**
   - Create indexes on frequently queried fields

## 🔍 Monitoring & Logging

### Activity Logging
- All user actions logged
- Login/Logout tracking
- Modification history
- Accessible via Dashboard > Recent Activities

### Error Handling
- Comprehensive error messages
- Stack trace in development
- User-friendly errors in production

## 🚨 Security Best Practices

1. **Change Default Secrets**
   - Update SESSION_SECRET in .env
   - Update JWT_SECRET in .env

2. **HTTPS in Production**
   - Use SSL/TLS certificates
   - Redirect HTTP to HTTPS

3. **Regular Backups**
   - Database backups daily
   - Configuration backups

4. **Access Control**
   - Restrict IP addresses (optional)
   - Use VPN for remote access

5. **Password Policy**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers
   - Regular password changes

## 📞 Support

**For Issues or Support:**
- Email: support@dmkfoundation.com
- Documentation: Check README.md
- GitHub Issues: Report bugs on GitHub

## 📅 Version History

### v1.0.0 (Current)
- ✅ Complete Loan Management System
- ✅ Admin & Staff dashboards
- ✅ All core modules
- ✅ Reporting system
- ✅ Activity logging

## 📝 License

DMK Foundation - Internal Use Only
Copyright © 2026 DMK Foundation

---

**System Status:** ✅ Production Ready
**Last Updated:** 2026-07-04
**Maintained By:** DMK Foundation IT Team
