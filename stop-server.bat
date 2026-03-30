@echo off
echo Stopping server on port 3000...
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
    set FOUND=1
)
if %FOUND%==1 (
    echo Server stopped.
) else (
    echo No server running on port 3000.
)
pause