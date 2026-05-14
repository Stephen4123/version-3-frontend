@echo off
REM Production Deployment Verification
setlocal enabledelayedexpansion

echo ==========================================
echo Production Deployment Verification
echo ==========================================
echo.

set PASS=0
set FAIL=0

REM Test Backend
echo 1. Backend Health Tests
echo ======================================
call :test_endpoint "Backend Health" "https://jeevajyothi-backend.onrender.com/health"
call :test_endpoint "Backend Voices" "https://jeevajyothi-backend.onrender.com/api/public/voices"
call :test_endpoint "Backend Speeches" "https://jeevajyothi-backend.onrender.com/api/public/speeches"

REM Test Worker
echo.
echo 2. Cloudflare Worker Tests
echo ======================================
call :test_endpoint "Worker Voices" "https://api.jeevajyothimedia.com/api/public/voices"
call :test_endpoint "Worker Speeches" "https://api.jeevajyothimedia.com/api/public/speeches"
call :test_endpoint "Worker Programs" "https://api.jeevajyothimedia.com/api/public/programs"

REM Summary
echo.
echo 3. Summary
echo ======================================
echo PASSED: %PASS%
echo FAILED: %FAIL%

if %FAIL% equ 0 (
    echo.
    echo SUCCESS: All tests passed!
    exit /b 0
) else (
    echo.
    echo FAILURE: Some tests failed
    exit /b 1
)

REM Function to test endpoint
:test_endpoint
set name=%~1
set url=%~2
echo Testing: %name%
echo   URL: %url%

for /f %%A in ('powershell -Command "try { (Invoke-WebRequest -Uri '%url%' -TimeoutSec 5).StatusCode } catch { 'ERROR' }"') do set status=%%A

if "%status%"=="200" (
    echo   [PASS] HTTP %status%
    set /a PASS+=1
) else (
    echo   [FAIL] HTTP %status%
    set /a FAIL+=1
)
echo.
exit /b
