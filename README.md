# DMK Foundation - Loan Management System

A comprehensive loan management system for DMK Foundation's internal office use. This application is designed for Admin and Staff users only, with no public customer access.

## Features

### Core Modules
- **Authentication**: Secure Admin and Staff login
- **Dashboard**: Real-time analytics and monitoring
- **Staff Management**: Complete staff lifecycle management
- **Branch Management**: Multi-branch support
- **Customer Management**: Customer database and profiles
- **Loan Management**: Loan application processing and approval workflow
- **EMI Management**: Collection tracking and management
- **Wallet**: Financial transactions and balance management
- **Cash Book**: Transaction recording and reconciliation
- **Reports**: Comprehensive analytics and reports

## Tech Stack
- **Backend**: Node.js + Express.js
- **Frontend**: HTML5, CSS3, JavaScript
- **Database**: MongoDB (or compatible)
- **Security**: bcryptjs for password hashing, session-based authentication

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file from `.env.example`
4. Start the server: `npm run dev`

## Project Structure

```
project/
├── public/                 # Static assets
├── routes/                 # API routes
├── models/                 # Data models
├── middleware/             # Custom middleware
├── controllers/            # Business logic
├── database/               # Database initialization
├── utils/                  # Utility functions
├── views/                  # HTML templates
└── server.js              # Entry point
```

## User Roles

### Admin
- Staff management (add, edit, delete)
- Loan approval/rejection
- Wallet management
- System settings
- View all reports

### Staff
- Customer management
- Loan applications
- EMI collection
- View assigned customers

## Security Features
- Secure password hashing
- Session-based authentication
- Role-based access control
- Activity logging
- Form validation

## Status
This is a production-ready system. All modules are fully functional.
