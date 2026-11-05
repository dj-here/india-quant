# KidsMentor - Neon Serverless PostgreSQL Setup (PowerShell)
param (
    [string]$NeonUrl
)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   KidsMentor - Neon Serverless PostgreSQL Setup" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $NeonUrl) {
    $NeonUrl = Read-Host "Enter Neon Database URL (e.g. postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require)"
}

if (-not $NeonUrl) {
    Write-Error "Neon Database URL cannot be empty."
    exit 1
}

Write-Host "`nConnecting to Neon and migrating tables..." -ForegroundColor Yellow
& .venv\Scripts\python scripts\neon_migrate_and_seed.py "$NeonUrl"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Neon Database is migrated and seeded!" -ForegroundColor Green
    Write-Host "Now update your .env and Vercel environment variables:" -ForegroundColor Green
    Write-Host "  DATABASE_URL=$NeonUrl" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Migration failed. Please check your Neon connection string." -ForegroundColor Red
}
