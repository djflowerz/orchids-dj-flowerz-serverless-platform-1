# Workers MCP Clerk Integration Guide

## Overview

The `workers-mcp-clerk` repository provides a Cloudflare Worker that acts as an MCP (Model Context Protocol) server, enabling Claude Desktop to interact with Clerk-protected API routes by impersonating users and generating valid JWTs.

## Architecture

```
Claude Desktop → MCP Worker → Clerk API → Your DJ Flowerz API Routes
```

### How It Works:
1. Claude Desktop sends a request to the MCP Worker
2. Worker impersonates a Clerk user using actor tokens
3. Worker generates a valid JWT for that user
4. JWT can be used to call your Clerk-protected API routes

## Integration Steps

### 1. Configure the MCP Worker

Navigate to the workers-mcp-clerk directory and update configuration:

```bash
cd workers-mcp-clerk
```

#### Update `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "djflowerz-mcp-clerk",
  "main": "src/index.ts",
  "compatibility_date": "2025-02-14",
  "observability": {
    "enabled": true
  },
  "vars": {
    "ALLOWED_ORIGINS": "https://djflowerz-site.pages.dev"
  }
}
```

### 2. Set Clerk Secret Key

You need to add your Clerk secret key as a Cloudflare Worker secret:

```bash
cd workers-mcp-clerk
npx wrangler secret put CLERK_SECRET_KEY
# When prompted, paste your Clerk secret key from .env.local
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy the Worker

```bash
npm run deploy
```

This will:
- Generate MCP documentation from your TypeScript code
- Deploy the worker to Cloudflare

### 5. Configure Claude Desktop

After deployment, you'll get a worker URL like:
```
https://djflowerz-mcp-clerk.YOUR_SUBDOMAIN.workers.dev
```

Add this to your Claude Desktop MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "djflowerz-clerk": {
      "url": "https://djflowerz-mcp-clerk.ianmuriithiflowerz.workers.dev"
    }
  }
}
```

### 6. Test the Integration

In Claude Desktop, try:
```
Say hello to ianmuriithiflowerz@gmail.com
```

The worker will:
1. Look up the user in Clerk
2. Generate an actor token
3. Create a session and get a JWT
4. Return a greeting with the JWT

## Extending the Worker

### Add Custom API Calls

You can extend the worker to call your DJ Flowerz API routes. Here's an example:

```typescript
/**
 * Get user orders from DJ Flowerz
 * @param email {string} The user's email address
 * @return {object} The user's orders
 */
async getUserOrders(email: string) {
  const jwt = await this.impersonate(email);
  
  const response = await fetch('https://djflowerz-site.pages.dev/api/orders', {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get orders: ${response.statusText}`);
  }
  
  return await response.json();
}
```

### Add Admin Functions

```typescript
/**
 * Get all users (admin only)
 * @param adminEmail {string} The admin's email address
 * @return {object} All users
 */
async getAllUsers(adminEmail: string) {
  const jwt = await this.impersonate(adminEmail);
  
  const response = await fetch('https://djflowerz-site.pages.dev/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get users: ${response.statusText}`);
  }
  
  return await response.json();
}
```

## Security Considerations

### 1. Restrict Access
The worker can impersonate ANY user in your Clerk organization. Consider:
- Limiting which users can be impersonated
- Adding IP allowlists
- Requiring additional authentication

### 2. Audit Logging
Add logging to track all impersonation requests:

```typescript
private async impersonate(emailOrUserId: string) {
  console.log(`Impersonation request for: ${emailOrUserId} at ${new Date().toISOString()}`);
  // ... rest of impersonation logic
}
```

### 3. Rate Limiting
Consider adding rate limiting to prevent abuse:

```typescript
// Use Cloudflare KV or Durable Objects for rate limiting
```

## Use Cases

### 1. Customer Support
Claude can help support agents by:
- Looking up user orders
- Checking subscription status
- Viewing user activity

### 2. Admin Tasks
Automate admin workflows:
- Bulk user operations
- Report generation
- Data analysis

### 3. Testing
Test your API routes with different user contexts:
- Regular users
- Premium subscribers
- Admin users

## Troubleshooting

### Worker Deployment Fails
```bash
# Check your wrangler authentication
npx wrangler whoami

# Re-authenticate if needed
npx wrangler login
```

### JWT Generation Fails
- Verify `CLERK_SECRET_KEY` is set correctly
- Check that the user exists in Clerk
- Ensure your Clerk instance is accessible

### API Calls Fail
- Verify the JWT is being passed correctly
- Check CORS settings on your API routes
- Ensure the user has the required permissions

## Next Steps

1. **Deploy the worker** to Cloudflare
2. **Configure Claude Desktop** with the worker URL
3. **Test basic functionality** with the `sayHello` function
4. **Extend with custom functions** for your specific use cases
5. **Add security measures** appropriate for your needs

## Resources

- [Cloudflare Workers MCP](https://github.com/cloudflare/workers-mcp)
- [Clerk Backend SDK](https://clerk.com/docs/references/backend/overview)
- [Model Context Protocol](https://modelcontextprotocol.io/)
