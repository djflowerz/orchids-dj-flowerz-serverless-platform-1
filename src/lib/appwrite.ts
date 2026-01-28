import { Client, Account, Databases, Storage } from 'appwrite';

// Client-side SDK (Public)
export const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;

if (projectId) {
    client
        .setEndpoint(endpoint)
        .setProject(projectId);
} else {
    console.warn('Appwrite Project ID not set in environment variables');
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Server-side Session Client (Next.js SSR)
export async function createSessionClient() {
    const { Client, Account, Databases, Storage } = await import('node-appwrite');
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    // Default session cookie name for Appwrite
    const sessionCookieName = `a_session_${projectId}`;
    const session = cookieStore.get(sessionCookieName);

    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

    if (session) {
        client.setSession(session.value);
    }

    return {
        get account() { return new Account(client); },
        get databases() { return new Databases(client); },
        get storage() { return new Storage(client); }
    };
}

// Server-side Admin SDK Helper (Admin Key)
export async function createAdminClient() {
    const { Client, Databases, Storage, Users } = await import('node-appwrite');

    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        getDatabases: () => new Databases(client),
        getStorage: () => new Storage(client),
        getUsers: () => new Users(client)
    };
}
