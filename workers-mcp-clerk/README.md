# DJ Flowerz MCP Clerk Worker

A Cloudflare Worker that acts as an MCP (Model Context Protocol) server, enabling Claude Desktop to interact with Clerk-protected DJ Flowerz API routes by impersonating users and generating valid JWTs.

## 🎯 Purpose

This worker allows Claude Desktop to:
- Access user-specific data (orders, cart, subscriptions)
- Perform admin operations (view all users, transactions)
- Test and debug Clerk-protected API routes
- Provide customer support with user context

## 🏗️ Architecture

```
Claude Desktop → MCP Worker → Clerk API → DJ Flowerz API Routes
```

### How It Works:
1. Claude Desktop calls a worker function (e.g., `getUserOrders`)
2. Worker impersonates the specified user via Clerk's actor token API
3. Worker generates a valid JWT for that user
4. Worker uses the JWT to call DJ Flowerz API routes
5. Worker returns the API response to Claude Desktop

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Clerk Secret Key

```bash
npx wrangler secret put CLERK_SECRET_KEY
# Paste your Clerk secret key when prompted
```

### 3. Deploy

```bash
./deploy.sh
# OR
npm run deploy
```

### 4. Configure Claude Desktop

Add the worker URL to your Claude Desktop MCP configuration:

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "djflowerz-clerk": {
      "url": "https://djflowerz-mcp-clerk.<your-subdomain>.workers.dev"
    }
  }
}
```

### 5. Test

In Claude Desktop, try:
```
Say hello to ianmuriithiflowerz@gmail.com
```

## 📚 Available Functions

### User Functions

#### `sayHello(email: string)`
Test function that returns a greeting with a JWT.

```typescript
// Example: Say hello to user@example.com
```

#### `getUserOrders(email: string)`
Get all orders for a specific user.

```typescript
// Example: Get orders for user@example.com
```

#### `getUserCart(email: string)`
Get the current cart for a specific user.

```typescript
// Example: Get cart for user@example.com
```

#### `getUserSubscription(email: string)`
Get subscription status and details for a user.

```typescript
// Example: Get subscription for user@example.com
```

#### `getProducts(email: string)`
Get all available products (requires authentication).

```typescript
// Example: Get products for user@example.com
```

#### `getYouTubeAccess(email: string)`
Get YouTube content access details for a user.

```typescript
// Example: Get YouTube access for user@example.com
```

### Admin Functions

⚠️ **These functions require admin privileges**

#### `getAllUsers(adminEmail: string)`
Get all users in the system.

```typescript
// Example: Get all users (admin: ianmuriithiflowerz@gmail.com)
```

#### `getAllTransactions(adminEmail: string)`
Get all transactions in the system.

```typescript
// Example: Get all transactions (admin: ianmuriithiflowerz@gmail.com)
```

## 🔒 Security

### Audit Logging
All impersonation requests are logged with:
- User ID and email
- Timestamp
- Function called

### Recommendations

1. **Restrict Access**: Only deploy to trusted environments
2. **Monitor Logs**: Regularly review Cloudflare Worker logs
3. **Rotate Secrets**: Periodically rotate your Clerk secret key
4. **IP Allowlist**: Consider adding IP restrictions in Cloudflare
5. **Rate Limiting**: Implement rate limiting for production use

### Security Considerations

⚠️ **IMPORTANT**: This worker can impersonate ANY user in your Clerk organization. Use with caution and only in trusted environments.

## 🛠️ Development

### Local Development

```bash
npm run dev
```

This starts a local development server with hot reloading.

### Testing

```bash
npm test
```

### Type Checking

```bash
npx tsc --noEmit
```

## 📝 Configuration

### Environment Variables

Set via `wrangler.jsonc` or Cloudflare dashboard:

- `CLERK_SECRET_KEY` (secret): Your Clerk secret key
- `DJFLOWERZ_API_URL` (var): DJ Flowerz API URL (default: `https://djflowerz-site.pages.dev`)

### Wrangler Configuration

Edit `wrangler.jsonc` to customize:
- Worker name
- Compatibility date
- API URL
- Observability settings

## 🔧 Extending the Worker

### Add a New Function

1. Add the function to `src/index.ts`:

```typescript
/**
 * Get user's mixtapes.
 * @param email {string} The user's email address.
 * @return {object} The user's mixtapes.
 */
async getUserMixtapes(email: string) {
  const jwt = await this.impersonate(email);
  
  const response = await fetch(`${this.apiUrl}/api/mixtapes`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get mixtapes: ${response.statusText}`);
  }
  
  return await response.json();
}
```

2. Deploy the updated worker:

```bash
npm run deploy
```

3. The function will automatically be available in Claude Desktop!

## 📊 Monitoring

### View Logs

```bash
npx wrangler tail
```

### View Metrics

Visit the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select `djflowerz-mcp-clerk`
3. View metrics and logs

## 🐛 Troubleshooting

### Deployment Fails

**Check authentication:**
```bash
npx wrangler whoami
```

**Re-authenticate if needed:**
```bash
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
- Check Cloudflare Worker logs for detailed errors

### TypeScript Errors

```bash
npm install
npx wrangler types
```

## 📖 Resources

- [Cloudflare Workers MCP](https://github.com/cloudflare/workers-mcp)
- [Clerk Backend SDK](https://clerk.com/docs/references/backend/overview)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)

## 🤝 Support

For issues specific to:
- **MCP Worker**: Check Cloudflare Worker logs
- **Clerk Integration**: Review Clerk dashboard and logs
- **DJ Flowerz API**: Check Next.js application logs

## 📄 License

Part of the DJ Flowerz platform.
