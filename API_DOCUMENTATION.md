# DMK Foundation - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Admin Login
```
POST /auth/admin-login
Content-Type: application/json

{
  "adminId": "ADM123456",
  "password": "password123",
  "rememberMe": true
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "adminId": "ADM123456",
    "username": "Admin Name",
    "email": "admin@example.com",
    "sessionId": "session-id"
  }
}
```

### 2. Staff Login
```
POST /auth/staff-login
Content-Type: application/json

{
  "staffId": "STF123456",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "staffId": "STF123456",
    "username": "Staff Name",
    "email": "staff@example.com",
    "branch": "Main Branch",
    "area": "Zone A",
    "sessionId": "session-id"
  }
}
```

### 3. Current Session
```
GET /auth/current-session

Response:
{
  "success": true,
  "message": "Session retrieved",
  "data": {
    "id": "user-id",
    "username": "User Name",
    "email": "user@example.com",
    "role": "admin" or "staff",
    "loginTime": "2026-07-04T10:00:00Z"
  }
}
```

### 4. Logout
```
POST /auth/logout

Response:
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

### 5. Change Password
```
POST /auth/change-password
Content-Type: application/json

{
  "oldPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}

Response:
{
  "success": true,
  "message": "Password changed successfully",
  "data": {}
}
```

### 6. Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "admin" or "staff"
}

Response:
{
  "success": true,
  "message": "If an account exists, a reset link has been sent",
  "data": {
    "resetToken": "token-string"
  }
}
```

## Staff Management Endpoints (Admin Only)

### 1. Add Staff
```
POST /staff/add
Content-Type: application/json

{
  "fullName": "John Doe",
  "mobileNumber": "9876543210",
  "email": "john@example.com",
  "aadhaarNumber": "123456789012",
  "panNumber": "ABCDE1234F",
  "address": "123 Main St",
  "branch": "Main Branch",
  "area": "Zone A",
  "designation": "Loan Officer",
  "joiningDate": "2026-07-04",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Staff added",
  "data": {
    "staffId": "STF123456",
    "fullName": "John Doe",
    "email": "john@example.com",
    "branch": "Main Branch",
    "area": "Zone A",
    "designation": "Loan Officer",
    "message": "Staff member added successfully"
  }
}
```

### 2. Get All Staff
```
GET /staff?search=john&branch=Main&status=active

Response:
{
  "success": true,
  "message": "Staff list retrieved",
  "data": [
    {
      "id": "staff-id",
      "staffId": "STF123456",
      "fullName": "John Doe",
      "mobileNumber": "9876543210",
      "email": "john@example.com",
      "branch": "Main Branch",
      "area": "Zone A",
      "designation": "Loan Officer",
      "joiningDate": "2026-07-04",
      "status": "active",
      "createdAt": "2026-07-04T10:00:00Z"
    }
  ]
}
```

### 3. Get Staff by ID
```
GET /staff/STF123456

Response:
{
  "success": true,
  "message": "Staff retrieved",
  "data": { /* staff object */ }
}
```

### 4. Update Staff
```
PUT /staff/STF123456
Content-Type: application/json

{
  "fullName": "Updated Name",
  "mobileNumber": "9876543210",
  "email": "updated@example.com",
  "address": "Updated Address",
  "branch": "Main Branch",
  "area": "Zone A",
  "designation": "Senior Officer"
}

Response:
{
  "success": true,
  "message": "Staff updated successfully",
  "data": { /* updated staff */ }
}
```

### 5. Delete Staff
```
DELETE /staff/STF123456

Response:
{
  "success": true,
  "message": "Staff deleted successfully",
  "data": {}
}
```

### 6. Activate Staff
```
PATCH /staff/STF123456/activate

Response:
{
  "success": true,
  "message": "Staff activated successfully",
  "data": { /* staff object */ }
}
```

### 7. Deactivate Staff
```
PATCH /staff/STF123456/deactivate

Response:
{
  "success": true,
  "message": "Staff deactivated successfully",
  "data": { /* staff object */ }
}
```

### 8. Reset Staff Password
```
POST /staff/STF123456/reset-password
Content-Type: application/json

{
  "newPassword": "new_password_123"
}

Response:
{
  "success": true,
  "message": "Staff password reset successfully",
  "data": {}
}
```

### 9. Get Staff Performance
```
GET /staff/STF123456/performance

Response:
{
  "success": true,
  "message": "Staff performance retrieved",
  "data": {
    "staffId": "STF123456",
    "fullName": "John Doe",
    "customersAdded": 45,
    "loansCreated": 30,
    "collectionAmount": 125000,
    "branch": "Main Branch",
    "area": "Zone A"
  }
}
```

## Customer Management Endpoints

### 1. Add Customer
```
POST /customer/add
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "mobileNumber": "9876543210",
  "email": "jane@example.com",
  "aadhaarNumber": "123456789012",
  "address": "123 Customer St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "branch": "Main Branch",
  "annualIncome": 500000,
  "occupation": "Business"
}

Response:
{
  "success": true,
  "message": "Customer added",
  "data": {
    "customerId": "CUS123456",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "mobileNumber": "9876543210",
    "branch": "Main Branch",
    "message": "Customer added successfully"
  }
}
```

### 2. Get All Customers
```
GET /customer?search=jane&branch=Main&status=active

Response:
{
  "success": true,
  "message": "Customers retrieved",
  "data": [ /* array of customers */ ]
}
```

### 3. Get Customer by ID
```
GET /customer/CUS123456
```

### 4. Update Customer
```
PUT /customer/CUS123456
Content-Type: application/json

{
  "fullName": "Updated Name",
  "address": "New Address",
  "annualIncome": 600000
}
```

### 5. Upload Document
```
POST /customer/CUS123456/upload-document
Content-Type: application/json

{
  "documentType": "Aadhaar",
  "documentUrl": "https://example.com/document.pdf"
}
```

### 6. Get Documents
```
GET /customer/CUS123456/documents
```

### 7. Deactivate Customer
```
PATCH /customer/CUS123456/deactivate
```

## Loan Management Endpoints

### 1. Create Loan Application
```
POST /loan/apply
Content-Type: application/json

{
  "customerId": "CUS123456",
  "loanAmount": 100000,
  "loanTerm": 12,
  "loanType": "Personal",
  "purpose": "Business Expansion",
  "branch": "Main Branch"
}

Response:
{
  "success": true,
  "message": "Loan application created",
  "data": {
    "loanId": "LON123456",
    "customerId": "CUS123456",
    "loanAmount": 100000,
    "monthlyEmi": 8750,
    "loanTerm": 12,
    "status": "pending",
    "message": "Loan application created successfully"
  }
}
```

### 2. Get All Loans
```
GET /loan?search=LON123456&status=pending&branch=Main
```

### 3. Get Loan by ID
```
GET /loan/LON123456
```

### 4. Approve Loan (Admin Only)
```
POST /loan/LON123456/approve
Content-Type: application/json

{
  "approvalNotes": "Approved as per criteria"
}
```

### 5. Reject Loan (Admin Only)
```
POST /loan/LON123456/reject
Content-Type: application/json

{
  "rejectionReason": "Insufficient income documentation"
}
```

### 6. Activate Loan (Admin Only)
```
PATCH /loan/LON123456/activate
```

## EMI Management Endpoints

### 1. Get All EMI Records
```
GET /emi?search=LON123456&status=pending
```

### 2. Get EMI by ID
```
GET /emi/emi-id
```

### 3. Collect EMI
```
POST /emi/collect/emi-id
Content-Type: application/json

{
  "amountPaid": 8750,
  "paymentMode": "Cash",
  "remarks": "Paid on time"
}
```

### 4. Get EMI by Loan
```
GET /emi/loan/LON123456
```

### 5. Get Overdue EMI
```
GET /emi/status/overdue
```

## Reports Endpoints

### 1. Loan Report
```
GET /reports/loan-report?branch=Main&status=active&startDate=2026-07-01&endDate=2026-07-31
```

### 2. Collection Report
```
GET /reports/collection-report?startDate=2026-07-01&endDate=2026-07-31
```

### 3. Cash Book
```
GET /reports/cash-book?startDate=2026-07-01&endDate=2026-07-31
```

### 4. Staff Performance
```
GET /reports/staff-performance
```

## Wallet Endpoints

### 1. Get Balance
```
GET /wallet/balance
```

### 2. Get Transactions
```
GET /wallet/transactions?limit=50
```

### 3. Add Funds (Admin Only)
```
POST /wallet/add-funds
Content-Type: application/json

{
  "amount": 50000,
  "description": "Opening balance",
  "reference": "OPEN-001"
}
```

### 4. Debit (Admin Only)
```
POST /wallet/debit
Content-Type: application/json

{
  "amount": 10000,
  "description": "Staff advance",
  "reference": "ADV-001"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Error Response Example

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Email is required", "Invalid phone number"]
}
```

---

**API Version:** 1.0.0
**Last Updated:** 2026-07-04
