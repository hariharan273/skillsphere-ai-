@echo off
title SkillSphere AI - Startup Script
echo ============================================
echo  SkillSphere AI - Starting Application
echo ============================================
echo.

echo [1/2] Starting Spring Boot Backend (port 8085)...
echo.
cd /d "%~dp0backend"
start "SkillSphere-Backend" cmd /k "mvn spring-boot:run"

echo Waiting 15 seconds for backend to initialize...
timeout /t 15 /nobreak > nul

echo.
echo [2/2] Starting Vite Frontend (port 3000)...
echo.
cd /d "%~dp0frontend"
start "SkillSphere-Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo  Both servers are starting!
echo  Backend:  http://localhost:8085
echo  Frontend: http://localhost:3000
echo ============================================
echo.
echo Open http://localhost:3000 in your browser.
echo Press any key to close this launcher window...
pause > nul
