#!/bin/bash

# DJ FLOWERZ - Cloudflare Pages Deployment Script
# This script helps you deploy to Cloudflare Pages with all environment variables configured

echo "🚀 DJ FLOWERZ - Cloudflare Pages Deployment"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Pre-deployment Checklist:"
echo ""
echo "1. ✅ Local code synced with GitHub repository"
echo "2. ⚠️  Ensure Cloudflare Pages environment variables are configured"
echo "3. ⚠️  Ensure Paystack webhook is configured"
echo ""

# Check git status
echo "🔍 Checking Git status..."
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes!"
    echo ""
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_message
        git add .
        git commit -m "$commit_message"
        echo "✅ Changes committed"
    else
        echo "⚠️  Proceeding without committing changes"
    fi
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
read -p "Push to origin/main? This will trigger Cloudflare Pages deployment. (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo ""
    echo "✅ Code pushed to GitHub!"
    echo ""
    echo "🎉 Deployment triggered on Cloudflare Pages!"
    echo ""
    echo "📊 Monitor deployment at:"
    echo "   https://dash.cloudflare.com/ca961f0eb41ca2bf77291b1769ca1c1d/pages/view/djflowerz"
    echo ""
    echo "🌐 Production URL:"
    echo "   https://djflowerz-site.pages.dev"
    echo ""
    echo "⏱️  Deployment typically takes 2-5 minutes"
    echo ""
else
    echo "❌ Deployment cancelled"
    exit 0
fi

# Environment variables reminder
echo "⚠️  IMPORTANT: Ensure these environment variables are set in Cloudflare Pages:"
echo ""
echo "   1. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "   2. CLERK_SECRET_KEY"
echo "   3. NEXT_PUBLIC_CLERK_FRONTEND_API"
echo "   4. CLERK_BACKEND_API"
echo "   5. CLERK_JWKS_URL"
echo "   6. NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"
echo "   7. PAYSTACK_SECRET_KEY"
echo "   8. NEXT_PUBLIC_PAYSTACK_CALLBACK_URL"
echo "   9. PAYSTACK_WEBHOOK_URL"
echo "   10. NEON_DATABASE_REST_URL"
echo "   11. DATABASE_URL"
echo "   12. NEXT_PUBLIC_APP_URL"
echo ""
echo "📖 See PRODUCTION_CONFIG.md for full configuration details"
echo ""
