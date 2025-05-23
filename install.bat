@echo off
echo ========================================
echo JIRA Plugin Quick Install
echo ========================================
echo.

if not exist "jira-plugin-2.0.0.vsix" (
    echo ERROR: jira-plugin-2.0.0.vsix not found!
    echo Please run build.bat first.
    pause
    exit /b 1
)

echo Installing JIRA Plugin to VS Code...
code --install-extension jira-plugin-2.0.0.vsix

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install extension!
    echo Make sure VS Code is installed and in PATH.
    echo.
    echo Alternative installation:
    echo   1. Open VS Code
    echo   2. Press Ctrl+Shift+P
    echo   3. Type: Extensions: Install from VSIX
    echo   4. Select jira-plugin-2.0.0.vsix
    pause
    exit /b 1
)

echo.
echo ========================================
echo INSTALLATION SUCCESSFUL!
echo ========================================
echo.
echo Please reload VS Code window to activate the extension.
echo.
pause