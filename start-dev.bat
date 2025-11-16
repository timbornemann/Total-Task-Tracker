@echo off
echo Starting Total-Task-Tracker Development Environment...
echo.
echo Starting Frontend (Vite) on port 8081...
start "Frontend - Vite" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul
echo.
echo Starting Backend (Node.js) on port 3002...
start "Backend - Node.js" cmd /k "npm run start:ts"
echo.
echo Both servers are starting in separate windows.
echo Close the windows to stop the servers.
pause

