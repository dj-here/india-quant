# KidsMentor - Push to GitHub Repository (PowerShell)
param (
    [string]$RepoUrl
)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   KidsMentor AI Tutor - Push to GitHub Repository" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $RepoUrl) {
    $RepoUrl = Read-Host "Enter your GitHub repository URL (e.g. https://github.com/dj-here/kidsmentor.git)"
}

if (-not $RepoUrl) {
    Write-Error "Repository URL cannot be empty."
    exit 1
}

Write-Host "`nSetting remote 'origin' to $RepoUrl..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $RepoUrl

Write-Host "Ensuring branch is named 'main'..." -ForegroundColor Yellow
git branch -M main

Write-Host "Adding and staging all KidsMentor files..." -ForegroundColor Yellow
git add .
git commit -m "feat: launch KidsMentor - production AI-only 1-on-1 tutoring platform (FastAPI, SymPy, Next.js, Neon, Vercel)" 2>$null

Write-Host "`nPushing KidsMentor codebase to $RepoUrl..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] KidsMentor pushed to $RepoUrl!" -ForegroundColor Green
    Write-Host "Next step: Go to Vercel (https://vercel.com/new) and" -ForegroundColor Green
    Write-Host "import this repository to deploy live." -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Push failed. Make sure the repository exists on GitHub and you have write permissions." -ForegroundColor Red
}
