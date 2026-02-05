#!/bin/bash

# DJ Flowerz MCP Worker Deployment Script
# This script deploys the MCP worker to Cloudflare

set -e

echo "🚀 DJ Flowerz MCP Worker Deployment"
echo "===================================="
echo ""

# Navigate to worker directory
cd "$(dirname "$0")"

# Check if CLERK_SECRET_KEY is set
echo "📋 Checking Clerk secret key..."
if ! npx wrangler secret list 2>/dev/null | grep -q "CLERK_SECRET_KEY"; then
  echo "⚠️  CLERK_SECRET_KEY not found in Cloudflare secrets"
  echo ""
  echo "Please set your Clerk secret key:"
  echo "  npx wrangler secret put CLERK_SECRET_KEY"
  echo ""
  read -p "Would you like to set it now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx wrangler secret put CLERK_SECRET_KEY
  else
    echo "❌ Deployment cancelled. Please set CLERK_SECRET_KEY before deploying."
    exit 1
  fi
fi

echo "✅ Clerk secret key is configured"
echo ""

# Generate MCP documentation
echo "📝 Generating MCP documentation..."
npm run deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Your worker should be available at:"
echo "   https://djflowerz-mcp-clerk.<your-subdomain>.workers.dev"
echo ""
echo "📖 Next steps:"
echo "   1. Note your worker URL from the deployment output above"
echo "   2. Add it to Claude Desktop configuration"
echo "   3. Test with: 'Say hello to ianmuriithiflowerz@gmail.com'"
echo ""
