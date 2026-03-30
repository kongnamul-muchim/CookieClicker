@echo off
echo Stopping server on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul
echo Starting server...
cd /d %~dp0
start "" cmd /k "npm start"
echo Server started in new window!
pause