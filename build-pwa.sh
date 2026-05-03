#!/bin/bash

# MeteoSran PWA Build and Test Script
# This script helps build and validate the PWA functionality

echo "🌤️  MeteoSran PWA Build Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check for environment variables
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found. Creating template..."
    cat > .env.local << EOL
# MeteoSran Environment Variables
# Copy this file and add your actual API keys

GEMINI_API_KEY=your_gemini_api_key_here
ACCUWEATHER_API_KEY=your_accuweather_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
EOL
    echo "📝 Please edit .env.local with your actual API keys"
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if service worker exists
if [ ! -f "public/sw.js" ]; then
    echo "❌ Service worker not found at public/sw.js"
    exit 1
fi

# Check if manifest exists
if [ ! -f "public/manifest.json" ]; then
    echo "❌ Web app manifest not found at public/manifest.json"
    exit 1
fi

# Check if offline page exists
if [ ! -f "public/offline.html" ]; then
    echo "❌ Offline page not found at public/offline.html"
    exit 1
fi

echo "✅ PWA files verified"

# PWA Validation Checklist
echo ""
echo "🔍 PWA Validation Checklist:"
echo "================================"

# Check for HTTPS requirement
echo "📋 Checklist for deployment:"
echo "  □ Serve over HTTPS (required for PWA)"
echo "  □ Service worker accessible from root domain"
echo "  □ Web app manifest linked in HTML"
echo "  □ Icons available in multiple sizes"
echo "  □ Offline page accessible"
echo "  □ App tested on mobile devices"

# Start preview server
echo ""
echo "🚀 Starting preview server..."
echo "   The app will be available at: http://localhost:4173"
echo "   Test PWA features:"
echo "   - Install prompt should appear"
echo "   - App should work offline"
echo "   - Service worker should cache resources"
echo ""

# Check if lighthouse is available
if command -v lighthouse &> /dev/null; then
    echo "💡 Tip: Run 'lighthouse http://localhost:4173 --view' to test PWA score"
else
    echo "💡 Tip: Install Lighthouse CLI to test PWA score: npm install -g lighthouse"
fi

echo ""
echo "Press Ctrl+C to stop the server"
npm run preview
