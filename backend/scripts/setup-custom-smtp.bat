@echo off
echo 📧 Setting up Supabase Custom SMTP Configuration
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is available

REM Install dependencies if needed
if not exist "node_modules\@supabase\supabase-js" (
    echo 📦 Installing Supabase dependencies...
    npm install @supabase/supabase-js
)

echo.
echo 🔧 Custom SMTP Configuration Tool
echo.
echo Before running, please set these environment variables:
echo.
echo Required:
echo   SUPABASE_ACCESS_TOKEN  - Get from https://supabase.com/dashboard/account/tokens
echo   SMTP_USER              - Your Gmail address
echo   SMTP_PASS              - Your Gmail app password (not regular password!)
echo.
echo Optional:
echo   SUPABASE_ANON_KEY      - Your project's anon key
echo.

REM Check for required environment variables
if "%SUPABASE_ACCESS_TOKEN%"=="" (
    echo ❌ SUPABASE_ACCESS_TOKEN is not set
    echo.
    echo How to get access token:
    echo 1. Go to https://supabase.com/dashboard/account/tokens
    echo 2. Click "Generate new token"
    echo 3. Copy the token
    echo 4. Set environment variable: 
    echo    set SUPABASE_ACCESS_TOKEN=your-token-here
    echo.
    pause
    exit /b 1
)

if "%SMTP_USER%"=="" (
    echo ❌ SMTP_USER is not set
    echo.
    echo How to setup Gmail SMTP:
    echo 1. Enable 2-Factor Authentication on your Gmail account
    echo 2. Go to Google Account settings ^> Security ^> App passwords
    echo 3. Generate an app password for "Mail"
    echo 4. Set environment variables:
    echo    set SMTP_USER=your-email@gmail.com
    echo    set SMTP_PASS=your-app-password
    echo.
    pause
    exit /b 1
)

if "%SMTP_PASS%"=="" (
    echo ❌ SMTP_PASS is not set (use Gmail app password, not regular password!)
    pause
    exit /b 1
)

echo ✅ All environment variables are set
echo.

REM Run the configuration script
echo 🚀 Running SMTP configuration...
node configure-custom-smtp.js

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Configuration completed successfully!
    echo.
    echo Next steps:
    echo 1. Test the configuration by trying to reset a password
    echo 2. Check your email templates in Supabase Dashboard
    echo 3. Update your application to use auth emails
    echo.
) else (
    echo.
    echo ❌ Configuration failed!
    echo Please check the error messages above and try again.
)

echo Press any key to exit...
pause >nul
