Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "[1/3] Run AquaTrade contract adapter tests..."
Push-Location "AquaTrade_B2B-Seafood-Marketplace/frontend"
npm run test:contract
Pop-Location

Write-Host "[2/3] Run backend final verification..."
powershell -ExecutionPolicy Bypass -File .\scripts\verify-final-backend.ps1

Write-Host "[3/3] Run D1-D4 security checks..."
Push-Location "security"
. .\fetch-lab-tokens.ps1
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
Pop-Location

Write-Host "Regression completed."
