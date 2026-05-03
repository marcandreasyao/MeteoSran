@echo off
setlocal

echo 🌤️  MeteoSran PWA Build Script
echo ================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

:: Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

:: Check for environment variables
if not exist ".env.local" (
    echo ⚠️  .env.local file not found. Creating template...
    echo # MeteoSran Environment Variables > .env.local
    echo # Copy this file and add your actual API keys >> .env.local
    echo. >> .env.local
    echo GEMINI_API_KEY=your_gemini_api_key_here >> .env.local
    echo ACCUWEATHER_API_KEY=your_accuweather_api_key_here >> .env.local
    echo VITE_FIREBASE_API_KEY=your_firebase_api_key >> .env.local
    echo VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain >> .env.local
    echo VITE_FIREBASE_PROJECT_ID=your_firebase_project_id >> .env.local
    echo VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket >> .env.local
    echo VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id >> .env.local
    echo VITE_FIREBASE_APP_ID=your_firebase_app_id >> .env.local
    echo VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id >> .env.local
    echo 📝 Please edit .env.local with your actual API keys
)

:: Build the application
echo 🔨 Building application...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed successfully

:: Check if service worker exists
if not exist "public\sw.js" (
    echo ❌ Service worker not found at public\sw.js
    pause
    exit /b 1
)

:: Check if manifest exists
if not exist "public\manifest.json" (
    echo ❌ Web app manifest not found at public\manifest.json
    pause
    exit /b 1
)

:: Check if offline page exists
if not exist "public\offline.html" (
    echo ❌ Offline page not found at public\offline.html
    pause
    exit /b 1
)

echo ✅ PWA files verified

:: PWA Validation Checklist
echo.
echo 🔍 PWA Validation Checklist:
echo ================================

echo 📋 Checklist for deployment:
echo   □ Serve over HTTPS (required for PWA)
echo   □ Service worker accessible from root domain
echo   □ Web app manifest linked in HTML
echo   □ Icons available in multiple sizes
echo   □ Offline page accessible
echo   □ App tested on mobile devices

:: Start preview server
echo.
echo 🚀 Starting preview server...
echo    The app will be available at: http://localhost:4173
echo    Test PWA features:
echo    - Install prompt should appear
echo    - App should work offline
echo    - Service worker should cache resources
echo.

:: Check if lighthouse is available
lighthouse --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 💡 Tip: Run 'lighthouse http://localhost:4173 --view' to test PWA score
) else (
    echo 💡 Tip: Install Lighthouse CLI to test PWA score: npm install -g lighthouse
)

echo.
echo Press Ctrl+C to stop the server
call npm run preview

pause
