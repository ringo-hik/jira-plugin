@echo off
echo ========================================
echo JIRA Plugin Development Build
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js found: 
node --version
echo.

echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo [3/4] Cleaning previous build...
call npm run clean
echo Clean completed!
echo.

echo [4/4] Starting watch mode...
echo.
echo ========================================
echo WATCH MODE ACTIVE
echo ========================================
echo.
echo TypeScript will recompile on file changes.
echo Press Ctrl+C to stop watching.
echo.
echo To debug the extension:
echo   1. Open VS Code in this folder
echo   2. Press F5 to start debugging
echo.
call npm run watch