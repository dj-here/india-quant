@echo off
setlocal

echo ========================================================
echo   KidsMentor AI Tutor - Push to GitHub Repository
echo ========================================================
echo.

set /p REPO_URL="Enter your GitHub repository URL (e.g. https://github.com/dj-here/kidsmentor.git): "

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

echo Adding and committing all KidsMentor files...
git add .
git commit -m "feat: launch KidsMentor - production AI-only 1-on-1 tutoring platform (FastAPI, SymPy, Next.js, Neon, Vercel)" 2>nul

echo.
echo Pushing KidsMentor codebase to %REPO_URL%...
git push -u origin main

if %ERRORLEVEL% equ 0 (
  echo.
  echo ========================================================
  echo [SUCCESS] KidsMentor pushed to %REPO_URL%!
  echo Next step: Go to Vercel (https://vercel.com/new) and
  echo import this repository to deploy live.
  echo ========================================================
) else (
  echo.
  echo [ERROR] Push failed. Make sure the repository exists on GitHub
  echo and you have write permissions.
)

pause
