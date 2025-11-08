#!/bin/bash

echo "🚀 Testing Admin and Auditor Interfaces..."
echo

# Test if development server is running
echo "📡 Checking if development server is running..."
if curl -s -f http://localhost:3000 > /dev/null; then
    echo "✅ Development server is running"
else
    echo "❌ Development server is not running"
    echo "Please run 'npm run dev' in the app directory first"
    exit 1
fi

echo

# Test Admin Interface
echo "📊 Testing Admin Interface..."
ADMIN_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/demo/admin -o /tmp/admin_response.html)
if [ "$ADMIN_RESPONSE" = "200" ]; then
    echo "✅ Admin page loads successfully (HTTP 200)"
    
    # Check for key admin elements in the response
    if grep -q "Privacy Administration" /tmp/admin_response.html; then
        echo "✅ Admin page title found"
    else
        echo "❌ Admin page title not found"
    fi
    
    if grep -q "Active Policies" /tmp/admin_response.html; then
        echo "✅ Admin metrics cards found"
    else
        echo "❌ Admin metrics cards not found"
    fi
    
    if grep -q "System Health" /tmp/admin_response.html; then
        echo "✅ System health monitoring found"
    else
        echo "❌ System health monitoring not found"
    fi
    
else
    echo "❌ Admin page failed to load (HTTP $ADMIN_RESPONSE)"
fi

echo

# Test Auditor Interface
echo "🔍 Testing Auditor Interface..."
AUDITOR_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/demo/auditor -o /tmp/auditor_response.html)
if [ "$AUDITOR_RESPONSE" = "200" ]; then
    echo "✅ Auditor page loads successfully (HTTP 200)"
    
    # Check for key auditor elements in the response
    if grep -q "Compliance Auditor" /tmp/auditor_response.html; then
        echo "✅ Auditor page title found"
    else
        echo "❌ Auditor page title not found"
    fi
    
    if grep -q "Blockchain Height" /tmp/auditor_response.html; then
        echo "✅ Blockchain metrics found"
    else
        echo "❌ Blockchain metrics not found"
    fi
    
    if grep -q "Consent Audit" /tmp/auditor_response.html; then
        echo "✅ Consent audit functionality found"
    else
        echo "❌ Consent audit functionality not found"
    fi
    
    if grep -q "Proof Generation" /tmp/auditor_response.html; then
        echo "✅ Proof generation functionality found"
    else
        echo "❌ Proof generation functionality not found"
    fi
    
else
    echo "❌ Auditor page failed to load (HTTP $AUDITOR_RESPONSE)"
fi

echo

# Test API endpoints
echo "🌐 Testing API Connectivity..."

# Test health endpoint
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3005/health -o /tmp/health_response.json)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health API endpoint working (HTTP 200)"
    if grep -q "healthy\|status" /tmp/health_response.json; then
        echo "✅ Health API returns valid data"
    fi
else
    echo "❌ Health API endpoint not working (HTTP $HEALTH_RESPONSE)"
fi

# Test policies endpoint
POLICIES_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3005/api/v1/policies -H "x-api-key: test-key" -o /tmp/policies_response.json)
if [ "$POLICIES_RESPONSE" = "200" ]; then
    echo "✅ Policies API endpoint working (HTTP 200)"
else
    echo "❌ Policies API endpoint not working (HTTP $POLICIES_RESPONSE)"
fi

echo

# Summary
echo "📈 Test Summary:"
echo "=================="

ADMIN_SCORE=0
AUDITOR_SCORE=0

if [ "$ADMIN_RESPONSE" = "200" ]; then
    ADMIN_SCORE=$((ADMIN_SCORE + 1))
fi
if grep -q "Privacy Administration" /tmp/admin_response.html 2>/dev/null; then
    ADMIN_SCORE=$((ADMIN_SCORE + 1))
fi
if grep -q "Active Policies" /tmp/admin_response.html 2>/dev/null; then
    ADMIN_SCORE=$((ADMIN_SCORE + 1))
fi

if [ "$AUDITOR_RESPONSE" = "200" ]; then
    AUDITOR_SCORE=$((AUDITOR_SCORE + 1))
fi
if grep -q "Compliance Auditor" /tmp/auditor_response.html 2>/dev/null; then
    AUDITOR_SCORE=$((AUDITOR_SCORE + 1))
fi
if grep -q "Blockchain Height" /tmp/auditor_response.html 2>/dev/null; then
    AUDITOR_SCORE=$((AUDITOR_SCORE + 1))
fi

echo "Admin Interface: $ADMIN_SCORE/3 tests passed"
echo "Auditor Interface: $AUDITOR_SCORE/3 tests passed"

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "API Health: ✅ Working"
else
    echo "API Health: ❌ Not Working"
fi

if [ "$POLICIES_RESPONSE" = "200" ]; then
    echo "API Policies: ✅ Working"
else
    echo "API Policies: ❌ Not Working"
fi

echo

if [ $ADMIN_SCORE -ge 2 ] && [ $AUDITOR_SCORE -ge 2 ]; then
    echo "🎉 Both interfaces are working well!"
    echo "✅ Admin and Auditor interfaces successfully finalized!"
else
    echo "⚠️ Some features may need attention."
fi

# Cleanup
rm -f /tmp/admin_response.html /tmp/auditor_response.html /tmp/health_response.json /tmp/policies_response.json