#!/bin/bash
# Production Deployment Verification Script

BACKEND_URL="https://jeevajyothi-backend.onrender.com"
WORKER_URL="https://api.jeevajyothimedia.com"
FRONTEND_URL="https://jeevajyothimedia.com"

echo "=========================================="
echo "Production Deployment Verification"
echo "=========================================="
echo ""

PASS=0
FAIL=0

test_endpoint() {
    local name=$1
    local url=$2
    echo "Testing: $name"
    echo "  URL: $url"
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url"); then
        if [ "$response" = "200" ]; then
            echo "  [PASS] HTTP $response"
            ((PASS++))
        else
            echo "  [FAIL] HTTP $response"
            ((FAIL++))
        fi
    else
        echo "  [FAIL] Connection error"
        ((FAIL++))
    fi
    echo ""
}

echo "1. Backend Health Tests"
echo "======================================"
test_endpoint "Backend Health" "$BACKEND_URL/health"
test_endpoint "Backend Voices" "$BACKEND_URL/api/public/voices"
test_endpoint "Backend Speeches" "$BACKEND_URL/api/public/speeches"

echo ""
echo "2. Cloudflare Worker Tests"
echo "======================================"
test_endpoint "Worker Voices" "$WORKER_URL/api/public/voices"
test_endpoint "Worker Speeches" "$WORKER_URL/api/public/speeches"
test_endpoint "Worker Programs" "$WORKER_URL/api/public/programs"

echo ""
echo "3. Summary"
echo "======================================"
echo "PASSED: $PASS"
echo "FAILED: $FAIL"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "SUCCESS: All tests passed!"
    exit 0
else
    echo ""
    echo "FAILURE: Some tests failed"
    exit 1
fi
