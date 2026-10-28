@echo off
setlocal

echo ========================================================
echo   PawStay Marketplace - Push to New GitHub Repository
echo ========================================================
echo.

set /p REPO_URL="Enter your new GitHub repository URL (e.g. https://github.com/dj-here/pawstay.git): "

if "%REPO_URL%"=="" (
  echo Error: Repository URL cannot be empty.
  pause
  exit /b 1
)

echo.
echo Setting remote 'origin' to %REPO_URL%...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo Ensuring branch is named 'main'...
git branch -M main

echo.
echo Pushing PawStay codebase to %REPO_URL%...
git push -u origin main

if %ERRORLEVEL% equ 0 (
  echo.
  echo ========================================================
  echo [SUCCESS] PawStay pushed to %REPO_URL%!
  echo Next step: Go to Vercel (https://vercel.com/new) and
  echo import this repository. It will deploy automatically.
  echo ========================================================
) else (
  echo.
  echo [ERROR] Push failed. Make sure the repository exists on GitHub
  echo and you have write permissions.
)

pause
