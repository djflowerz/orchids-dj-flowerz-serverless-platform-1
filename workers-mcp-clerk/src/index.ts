import { WorkerEntrypoint } from 'cloudflare:workers';
import { ProxyToSelf } from 'workers-mcp';
import { createClerkClient, type User } from "@clerk/backend";

const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Env {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY?: string;
  DJFLOWERZ_API_URL?: string; // Optional: defaults to production
}

export default class DJFlowerzMCPWorker extends WorkerEntrypoint<Env> {
  private get apiUrl(): string {
    return this.env.DJFLOWERZ_API_URL || 'https://djflowerz-site.pages.dev';
  }

  /**
   * A warm, friendly greeting from your new MCP server.
   * @param email {string} The email of the person to greet.
   * @return {string} The greeting message with JWT.
   */
  async sayHello(email: string) {
    const jwt = await this.impersonate(email);
    return `Hello from DJ Flowerz MCP Worker, ${email}! Your JWT is ${jwt}`;
  }

  /**
   * Get user's orders from DJ Flowerz store.
   * @param email {string} The user's email address.
   * @return {object} The user's orders.
   */
  async getUserOrders(email: string) {
    const jwt = await this.impersonate(email);

    // Check if we have orders endpoint
    try {
      const response = await fetch(`${this.apiUrl}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get orders: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  /**
   * Get user's cart from DJ Flowerz store.
   * @param email {string} The user's email address.
   * @return {object} The user's cart.
   */
  async getUserCart(email: string) {
    const jwt = await this.impersonate(email);

    const response = await fetch(`${this.apiUrl}/api/cart`, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get cart: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user's subscription status.
   * @param email {string} The user's email address.
   * @return {object} The user's subscription details.
   */
  async getUserSubscription(email: string) {
    const jwt = await this.impersonate(email);

    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get subscription: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all users (admin only).
   * @param adminEmail {string} The admin's email address.
   * @return {object} All users.
   */
  async getAllUsers(adminEmail: string) {
    const jwt = await this.impersonate(adminEmail);

    const response = await fetch(`${this.apiUrl}/api/admin/users`, {
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

  /**
   * Get all transactions (admin only).
   * @param adminEmail {string} The admin's email address.
   * @return {object} All transactions.
   */
  async getAllTransactions(adminEmail: string) {
    const jwt = await this.impersonate(adminEmail);

    const response = await fetch(`${this.apiUrl}/api/admin/transactions`, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all products from the store.
   * @param email {string} The user's email address.
   * @return {object} All products.
   */
  async getProducts(email: string) {
    const jwt = await this.impersonate(email);

    const response = await fetch(`${this.apiUrl}/api/products`, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get products: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get YouTube content access for a user.
   * @param email {string} The user's email address.
   * @return {object} YouTube content access details.
   */
  async getYouTubeAccess(email: string) {
    const jwt = await this.impersonate(email);

    const response = await fetch(`${this.apiUrl}/api/youtube`, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get YouTube access: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * @ignore
   */
  async fetch(request: Request): Promise<Response> {
    // ProxyToSelf handles MCP protocol compliance.
    return new ProxyToSelf(this).fetch(request);
  }

  /**
   * @ignore
   */
  private async impersonate(emailOrUserId: string) {
    console.log(`Starting impersonation for: ${emailOrUserId}`);
    const user = await this.getUser(emailOrUserId);

    if (!user) {
      throw new Error(`User ${emailOrUserId} not found`);
    }

    console.log(`Impersonating user ID: ${user.id} (${emailOrUserId})`);

    // Create actor token using Clerk API
    const actorTokenResponse = await fetch('https://api.clerk.com/v1/actor_tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getClerkSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        expires_in_seconds: 600,
        actor: {
          sub: 'DJ Flowerz MCP Server',
        },
      }),
    });

    if (!actorTokenResponse.ok) {
      const errorText = await actorTokenResponse.text();
      console.error(`Failed to create actor token: ${actorTokenResponse.status} ${actorTokenResponse.statusText}`, errorText);
      throw new Error(`Failed to create actor token: ${actorTokenResponse.statusText}. Check logs for details.`);
    }

    const { token: ticket, url } = (await actorTokenResponse.json()) as { token: string; url: string };

    const clerkFrontendAPI = new URL(url).origin;
    console.log(`Clerk Frontend API: ${clerkFrontendAPI}`);

    // Sign in using the actor token
    const signInResponse = await fetch(`${clerkFrontendAPI}/v1/client/sign_ins?__clerk_api_version=2024-10-01`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        strategy: 'ticket',
        ticket,
      }).toString(),
    });

    if (!signInResponse.ok) {
      const errorText = await signInResponse.text();
      console.error(`Failed to sign in: ${signInResponse.status} ${signInResponse.statusText}`, errorText);
      throw new Error(`Failed to sign in: ${signInResponse.statusText}. Check logs for details.`);
    }

    const { client } = (await signInResponse.json()) as {
      client: { last_active_session_id: string; sessions: { id: string; last_active_token: { jwt: string } }[] };
    };

    const jwt = client.sessions.find((s) => s.id === client.last_active_session_id)?.last_active_token.jwt;

    if (!jwt) {
      console.error("No JWT found in session");
      throw new Error('Failed to get JWT');
    }

    return jwt;
  }

  /**
   * @ignore
   */
  private async getUser(emailOrUserId: string): Promise<User> {
    console.log("Getting user info for: ", emailOrUserId);
    const clerk = createClerkClient({
      secretKey: this.getClerkSecretKey(),
      publishableKey: this.env.CLERK_PUBLISHABLE_KEY
    });

    try {
      if ((emailOrUserId || '').startsWith('user_')) {
        return await clerk.users.getUser(emailOrUserId);
      }

      if (BASIC_EMAIL_REGEX.test(emailOrUserId || '')) {
        const users = await clerk.users.getUserList({
          emailAddress: [emailOrUserId],
          orderBy: '-last_sign_in_at',
        });

        if (users.data.length === 0) {
          console.log(`No user found for email: ${emailOrUserId}`);
        } else {
          console.log(`Found ${users.data.length} users for email: ${emailOrUserId}`);
        }
        return users.data[0];
      }
    } catch (error) {
      console.error("Error getting user from Clerk:", error);
    }

    throw new Error(`Invalid user ID or email: ${emailOrUserId}. Please provide a valid user ID or email address.`);
  }

  /**
   * @ignore
   */
  private getClerkSecretKey(): string {
    if (!this.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not set');
    }
    return this.env.CLERK_SECRET_KEY;
  }

}