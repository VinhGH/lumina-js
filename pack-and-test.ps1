# Lumina SDK Pack & Smoke Test Setup Script
# Run this from the lumina-js root directory: D:\Lumina-js\lumina-js
# 
# Usage:
#   .\pack-and-test.ps1

Write-Host "🌟 Lumina SDK — Pack & Smoke Test Setup" -ForegroundColor Magenta
Write-Host ""

# Step 1: Pack the SDK from packages/sdk
Write-Host "📦 Step 1: Packing @lumina/sdk..." -ForegroundColor Cyan
Set-Location "D:\Lumina-js\lumina-js\packages\sdk"
& "C:\Program Files\nodejs\npm.cmd" pack 2>&1 | Select-String "filename:|package size:|total files:"

$tgz = Get-ChildItem -Filter "lumina-sdk-*.tgz" | Select-Object -First 1
if (-not $tgz) {
    Write-Host "❌ Pack failed — tgz not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Packed: $($tgz.Name) ($([Math]::Round($tgz.Length / 1024, 1)) KB)" -ForegroundColor Green

# Step 2: Copy to dist-packages
Write-Host ""
Write-Host "📁 Step 2: Copying to dist-packages..." -ForegroundColor Cyan
Copy-Item $tgz.FullName "D:\Lumina-js\lumina-js\dist-packages\$($tgz.Name)" -Force
Write-Host "✅ Copied to dist-packages\" -ForegroundColor Green

# Step 3: Install in smoke test project
Write-Host ""
Write-Host "🔧 Step 3: Installing in lumina-smoke-test..." -ForegroundColor Cyan
Set-Location "D:\lumina-smoke-test"
& "C:\Users\thaiv\AppData\Roaming\npm\pnpm.cmd" install

Write-Host ""
Write-Host "✅ Done! Now run:" -ForegroundColor Green
Write-Host "   cd D:\lumina-smoke-test" -ForegroundColor Yellow
Write-Host "   pnpm dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Then open: http://localhost:5173/login" -ForegroundColor Cyan
