#!/bin/bash

# DMK Foundation Deployment Script
# This script automates deployment to production

echo "🚀 DMK Foundation Deployment Started"
echo "====================================="

# Check Node.js
echo "✓ Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install Node.js 16+"
    exit 1
fi
echo "✓ Node.js $(node -v) found"

# Check npm
echo "✓ Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "✗ npm not found."
    exit 1
fi
echo "✓ npm $(npm -v) found"

# Install dependencies
echo "✓ Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "✗ Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed successfully"

# Check .env file
echo "✓ Checking environment configuration..."
if [ ! -f .env ]; then
    echo "⚠ .env file not found. Creating from template..."
    cp .env.example .env
    echo "⚠ Please update .env file with your configuration"
    echo "⚠ Especially: SESSION_SECRET, JWT_SECRET, DATABASE_URL"
fi
echo "✓ Environment file ready"

# Create necessary directories
echo "✓ Creating required directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups
echo "✓ Directories created"

# Start server
echo ""
echo "🎯 Starting DMK Foundation Server..."
echo "====================================="
echo "✓ Server will be available at: http://localhost:5000"
echo "✓ Press Ctrl+C to stop the server"
echo ""

NODE_ENV=production npm start
