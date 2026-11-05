@echo off
setlocal

echo ========================================================
echo   KidsMentor - Neon Serverless PostgreSQL Setup
echo ========================================================
echo.
echo Please provide your Neon PostgreSQL database URL.
echo You can obtain this from https://console.neon.tech
echo.

set /p NEON_URL="Enter Neon Database URL (e.g. postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require): "

if "%NEON_URL%"=="" (
  echo Error: Neon Database URL cannot be empty.
  pause
  exit /b 1
)

echo.
echo Connecting to Neon and migrating tables...
.venv\Scripts\python scripts\neon_migrate_and_seed.py "%NEON_URL%"

if %ERRORLEVEL% equ 0 (
  echo.
  echo ========================================================
  echo [SUCCESS] Neon Database is migrated and seeded!
  echo Now update your .env and Vercel environment variables:
  echo   DATABASE_URL=%NEON_URL%
  echo ========================================================
) else (
  echo.
  echo [ERROR] Migration failed. Please check your Neon connection string.
)

pause
