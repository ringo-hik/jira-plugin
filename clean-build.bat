@echo off
echo ========================================
echo JIRA Plugin Clean Build
echo ========================================
echo.

echo [1/3] Removing old files...
if exist "out" rmdir /s /q "out"
if exist "node_modules" rmdir /s /q "node_modules"
if exist "*.vsix" del /q "*.vsix"
if exist "package-lock.json" del /q "package-lock.json"
echo Old files removed!
echo.

echo [2/3] Fresh install and build...
call build.bat

echo.
echo ========================================
echo CLEAN BUILD COMPLETED!
echo ========================================
echo.
pause