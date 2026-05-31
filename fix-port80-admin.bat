@echo off
echo [1/3] Stopping Apache2.4 (XAMPP)...
net stop Apache2.4
if %errorlevel% neq 0 (
  echo WARNING: net stop failed, trying sc stop...
  sc stop Apache2.4
)
echo [2/3] Waiting 2 seconds...
timeout /t 2 /nobreak >nul
echo [3/3] Done. Apache stopped.
echo.
echo You can now close this window and run fix-port80-step2.ps1
pause
