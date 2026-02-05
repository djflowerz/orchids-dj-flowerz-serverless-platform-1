#!/bin/bash

# 🚀 Quick Deploy to Cloudflare Pages via Wrangler
# Use this if dashboard deployment is not working

set -e  # Exit on error

echo "🚀 DJ Flowerz - Direct Deployment to Cloudflare Pages"
echo "======================================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler CLI not found. Installing..."
    npm install -g wrangler
    echo "✅ Wrangler installed"
    echo ""
fi

# Check if user is logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Not logged in to Cloudflare. Please login:"
    wrangler login
else
    echo "✅ Already logged in to Cloudflare"
fi
echo ""

# Build the project
echo "🔨 Building project..."
export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
echo "Running: npm run pages:build"
echo ""
npm run pages:build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Please fix build errors and try again."
    exit 1
fi

echo ""
echo "✅ Build completed successfully"
echo ""

# Check if build output exists
if [ ! -d ".vercel/output/static" ]; then
    echo "❌ Build output directory not found: .vercel/output/static"
    exit 1
fi

echo "📦 Build output found at: .vercel/output/static"
echo ""

# Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
echo "Project: djflowerz-site"
echo ""

wrangler pages deploy .vercel/output/static --project-name=djflowerz-site

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================"
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "======================================================"
    echo ""
    echo "Your site should be live at:"
    echo "🔗 https://djflowerz-site.pages.dev"
    echo ""
    echo "⏰ Wait 1-2 minutes for changes to propagate"
    echo ""
    echo "🧪 Test your deployment:"
    echo "   ./verify-deployment.sh"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if you're logged in: wrangler whoami"
    echo "2. Verify project name: djflowerz-site"
    echo "3. Check Cloudflare dashboard for errors"
    echo ""
    exit 1
fi
