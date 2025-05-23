@echo off
echo ========================================
echo JIRA Plugin Build Script
echo ========================================
echo.

echo [1/5] Checking Node.js installation...
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

echo [2/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo [3/5] Cleaning previous build...
call npm run clean
echo Clean completed!
echo.

echo [4/5] Compiling TypeScript...
call npm run compile
if errorlevel 1 (
    echo ERROR: TypeScript compilation failed!
    pause
    exit /b 1
)
echo TypeScript compilation successful!
echo.

echo [5/5] Creating VSIX package...
where vsce >nul 2>&1
if errorlevel 1 (
    echo vsce not found. Installing globally...
    call npm install -g vsce
)

call vsce package
if errorlevel 1 (
    echo ERROR: Failed to create VSIX package!
    pause
    exit /b 1
)
echo.

echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo VSIX file created: jira-plugin-2.0.0.vsix
echo.
echo To install in VS Code:
echo   1. Open VS Code
echo   2. Press Ctrl+Shift+P
echo   3. Type: Extensions: Install from VSIX
echo   4. Select the jira-plugin-2.0.0.vsix file
echo.
echo Or run: code --install-extension jira-plugin-2.0.0.vsix
echo.
pause