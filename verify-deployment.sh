#!/bin/bash

# 🔍 Cloudflare Pages Deployment Verification Script
# This script checks if your deployment is live and all routes are working

echo "🚀 DJ Flowerz - Deployment Verification"
echo "========================================"
echo ""

SITE_URL="https://djflowerz-site.pages.dev"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" -eq 200 ]; then
        echo -e "${GREEN}✅ OK (200)${NC}"
        return 0
    elif [ "$status_code" -eq 404 ]; then
        echo -e "${RED}❌ NOT FOUND (404)${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  Status: $status_code${NC}"
        return 2
    fi
}

echo "Testing critical routes:"
echo ""

# Test routes
check_url "$SITE_URL/" "Homepage"
check_url "$SITE_URL/login" "Login Page"
check_url "$SITE_URL/signup" "Signup Page"
check_url "$SITE_URL/store" "Store Page"
check_url "$SITE_URL/pricing" "Pricing Page"
check_url "$SITE_URL/admin" "Admin Page"
check_url "$SITE_URL/cart" "Cart Page"
check_url "$SITE_URL/mixtapes" "Mixtapes Page"
check_url "$SITE_URL/tip-jar" "Tip Jar Page"
check_url "$SITE_URL/subscribe" "Subscribe Page"

echo ""
echo "========================================"
echo ""

# Check if deployment is recent
echo "📊 Additional Checks:"
echo ""

# Check if site is reachable
if curl -s --head "$SITE_URL" | head -n 1 | grep "HTTP/[12].[01] [23].." > /dev/null; then
    echo -e "${GREEN}✅ Site is reachable${NC}"
else
    echo -e "${RED}❌ Site is not reachable${NC}"
fi

# Check for Cloudflare headers
if curl -s --head "$SITE_URL" | grep -i "cf-ray" > /dev/null; then
    echo -e "${GREEN}✅ Served by Cloudflare${NC}"
else
    echo -e "${YELLOW}⚠️  Not served by Cloudflare (might be cached)${NC}"
fi

echo ""
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. If you see 404 errors, wait 2-5 minutes for deployment"
echo "2. Check deployment status: https://dash.cloudflare.com/"
echo "3. Clear browser cache and try again"
echo "4. If issues persist, check DEPLOYMENT_FIX_GUIDE.md"
echo ""
echo "🔗 View your site: $SITE_URL"
echo ""
