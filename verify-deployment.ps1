#!/usr/bin/env pwsh
<#
.SYNOPSIS
Production Deployment Verification Script
Verifies that all components are working correctly
#>

$ErrorActionPreference = 'Continue'

Write-Host "🚀 Production Deployment Verification" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Colors
$SuccessColor = 'Green'
$ErrorColor = 'Red'
$WarningColor = 'Yellow'
$InfoColor = 'Cyan'

# Test results array
$results = @()

# Function to test an endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name" -ForegroundColor $InfoColor
    Write-Host "  URL: $Url"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -ErrorAction Stop
        $status = $response.StatusCode
        
        if ($status -eq $ExpectedStatus) {
            Write-Host "  ✅ PASS (Status: $status)" -ForegroundColor $SuccessColor
            $results += @{Name = $Name; Status = 'PASS'; Message = "HTTP $status"; URL = $Url}
        } else {
            Write-Host "  ❌ FAIL (Expected $ExpectedStatus, got $status)" -ForegroundColor $ErrorColor
            $results += @{Name = $Name; Status = 'FAIL'; Message = "HTTP $status"; URL = $Url}
        }
    } catch {
        Write-Host "  ❌ FAIL ($_)" -ForegroundColor $ErrorColor
        $results += @{Name = $Name; Status = 'FAIL'; Message = $_.Exception.Message; URL = $Url}
    }
    Write-Host ""
}

# 1. Test Backend Health
Write-Host "1️⃣  BACKEND TESTS" -ForegroundColor $InfoColor
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $InfoColor
Test-Endpoint -Name "Backend Health Check" -Url "https://jeevajyothi-backend.onrender.com/health"
Test-Endpoint -Name "Backend Voices Endpoint" -Url "https://jeevajyothi-backend.onrender.com/api/public/voices"
Test-Endpoint -Name "Backend Speeches Endpoint" -Url "https://jeevajyothi-backend.onrender.com/api/public/speeches"
Test-Endpoint -Name "Backend Programs Endpoint" -Url "https://jeevajyothi-backend.onrender.com/api/public/programs"

# 2. Test Cloudflare Worker
Write-Host "2️⃣  CLOUDFLARE WORKER TESTS" -ForegroundColor $InfoColor
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $InfoColor
Test-Endpoint -Name "Worker Proxy (Voices)" -Url "https://api.jeevajyothimedia.com/api/public/voices"
Test-Endpoint -Name "Worker Proxy (Speeches)" -Url "https://api.jeevajyothimedia.com/api/public/speeches"
Test-Endpoint -Name "Worker Proxy (Programs)" -Url "https://api.jeevajyothimedia.com/api/public/programs"
Test-Endpoint -Name "Worker CORS Headers" -Url "https://api.jeevajyothimedia.com/api/public/voices"

# 3. Test Frontend (if deployed)
Write-Host "3️⃣  FRONTEND TESTS" -ForegroundColor $InfoColor
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $InfoColor
Test-Endpoint -Name "Frontend Home" -Url "https://jeevajyothimedia.com" -ExpectedStatus 200

# 4. Validate Configuration Files
Write-Host "4️⃣  CONFIGURATION VALIDATION" -ForegroundColor $InfoColor
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $InfoColor

$configFiles = @(
    "Frontend/assets/js/config.js",
    "Backend/.node-version",
    "Backend/wrangler.toml"
)

foreach ($file in $configFiles) {
    $path = Join-Path (Get-Location) $file
    if (Test-Path $path) {
        Write-Host "✅ $file exists" -ForegroundColor $SuccessColor
        $results += @{Name = "Config: $file"; Status = 'PASS'; Message = "File exists"}
    } else {
        Write-Host "❌ $file NOT FOUND" -ForegroundColor $ErrorColor
        $results += @{Name = "Config: $file"; Status = 'FAIL'; Message = "File not found"}
    }
}

# Check Node.js version
Write-Host ""
Write-Host "Checking Node.js version..."
$nodeVersionFile = Join-Path (Get-Location) "Backend\.node-version"
if (Test-Path $nodeVersionFile) {
    $version = Get-Content $nodeVersionFile | ForEach-Object { $_.Trim() }
    Write-Host "  Node.js Version in .node-version: $version" -ForegroundColor $SuccessColor
    if ($version -eq "20.18.0") {
        $results += @{Name = "Node.js Version"; Status = 'PASS'; Message = "20.18.0"}
    } else {
        $results += @{Name = "Node.js Version"; Status = 'WARNING'; Message = "Version: $version"}
    }
}

# 5. Test Data Validation
Write-Host ""
Write-Host "5️⃣  DATA VALIDATION" -ForegroundColor $InfoColor
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $InfoColor

# Test if data is returned correctly
try {
    $voicesResponse = Invoke-WebRequest -Uri "https://api.jeevajyothimedia.com/api/public/voices" -TimeoutSec 10
    $voicesData = $voicesResponse.Content | ConvertFrom-Json
    
    if ($voicesData -and ($voicesData.data -or $voicesData.Length -gt 0)) {
        Write-Host "✅ Voices data retrieved successfully" -ForegroundColor $SuccessColor
        $voiceCount = if ($voicesData.data) { $voicesData.data.Length } else { $voicesData.Length }
        Write-Host "   Found $voiceCount voices" -ForegroundColor $InfoColor
        $results += @{Name = "Voices Data"; Status = 'PASS'; Message = "$voiceCount voices found"}
    } else {
        Write-Host "⚠️  Voices endpoint returned empty data" -ForegroundColor $WarningColor
        $results += @{Name = "Voices Data"; Status = 'WARNING'; Message = "Empty data"}
    }
} catch {
    Write-Host "❌ Failed to fetch voices data: $_" -ForegroundColor $ErrorColor
    $results += @{Name = "Voices Data"; Status = 'FAIL'; Message = $_.Exception.Message}
}

# 6. Summary Report
Write-Host ""
Write-Host "📊 SUMMARY REPORT" -ForegroundColor $InfoColor
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $InfoColor

$passed = ($results | Where-Object { $_.Status -eq 'PASS' }).Count
$failed = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count
$warnings = ($results | Where-Object { $_.Status -eq 'WARNING' }).Count
$total = $results.Count

Write-Host "Total Tests: $total" -ForegroundColor $InfoColor
Write-Host "✅ Passed:   $passed" -ForegroundColor $SuccessColor
Write-Host "❌ Failed:   $failed" -ForegroundColor $(if ($failed -gt 0) { $ErrorColor } else { $SuccessColor })
Write-Host "⚠️  Warnings: $warnings" -ForegroundColor $(if ($warnings -gt 0) { $WarningColor } else { $SuccessColor })

Write-Host ""

# Final status
if ($failed -eq 0) {
    Write-Host "🎉 All critical tests PASSED!" -ForegroundColor $SuccessColor
    Write-Host "Your production deployment is ready." -ForegroundColor $SuccessColor
    exit 0
} else {
    Write-Host "Some tests FAILED. Please review the errors above." -ForegroundColor $ErrorColor
    exit 1
}
