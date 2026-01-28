const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' }); // Load env vars

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const key = process.env.APPWRITE_API_KEY;

if (!project || project === 'REPLACE_WITH_YOUR_PROJECT_ID') {
    console.error('Error: NEXT_PUBLIC_APPWRITE_PROJECT is not set in .env.local');
    process.exit(1);
}

if (!key) {
    console.error('Error: APPWRITE_API_KEY is not set in .env.local');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(key);

const databases = new Databases(client);

const DB_ID = 'dj_flowerz_db';

const COLLECTIONS = [
    {
        id: 'products',
        name: 'Products',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 5000, required: true },
            { key: 'price', type: 'double', required: true },
            { key: 'image', type: 'string', size: 1024, required: true }, // URL
            { key: 'category', type: 'string', size: 100, required: true },
            { key: 'downloadUrl', type: 'string', size: 1024, required: false }, // For digital products
            { key: 'isDigital', type: 'boolean', required: false, default: false }
        ]
    },
    {
        id: 'mixtapes',
        name: 'Mixtapes',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 5000, required: false },
            { key: 'coverImage', type: 'string', size: 1024, required: true },
            { key: 'mixLink', type: 'string', size: 1024, required: false }, // Direct link or S3
            { key: 'price', type: 'double', required: false, default: 0 },
            { key: 'isFree', type: 'boolean', required: false, default: true }
        ]
    },
    {
        id: 'orders',
        name: 'Orders',
        attributes: [
            { key: 'userId', type: 'string', size: 255, required: true }, // Links to Appwrite Auth or User collection
            { key: 'totalAmount', type: 'double', required: true },
            { key: 'status', type: 'string', size: 50, required: false, default: 'pending' }, // pending, completed, failed
            { key: 'paymentReference', type: 'string', size: 255, required: false }, // Paystack ref
            { key: 'customerEmail', type: 'string', size: 255, required: true }
        ]
    },
    // Add more collections as needed
];

async function setup() {
    console.log('Starting Appwrite Schema Setup...');
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Project: ${project}`);

    // 1. Create Database
    try {
        await databases.get(DB_ID);
        console.log(`Database "${DB_ID}" already exists.`);
    } catch (err) {
        if (err.code === 404) {
            console.log(`Creating database "${DB_ID}"...`);
            await databases.create(DB_ID, 'DJ Flowerz Main DB', true); // enabled: true
            console.log(`Database "${DB_ID}" created.`);
        } else {
            throw err;
        }
    }

    // 2. Create Collections & Attributes
    for (const col of COLLECTIONS) {
        let collectionId = col.id;

        // Check/Create Collection
        try {
            await databases.getCollection(DB_ID, collectionId);
            console.log(`Collection "${col.name}" already exists.`);
        } catch (err) {
            if (err.code === 404) {
                console.log(`Creating collection "${col.name}"...`);
                await databases.createCollection(DB_ID, collectionId, col.name);
                console.log(`Collection "${col.name}" created.`);
            } else {
                console.error(`Error checking collection ${col.name}:`, err.message);
                continue;
            }
        }

        // Check/Create Attributes
        // Note: Attribute creation is async and takes time. Appwrite might return 409 if exists.
        // We will try to create and ignore "Attribute already exists" errors.
        console.log(`Configuring attributes for "${col.name}"...`);
        for (const attr of col.attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(DB_ID, collectionId, attr.key, attr.size, attr.required, attr.default, false);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(DB_ID, collectionId, attr.key, attr.required, attr.min, attr.max, attr.default, false);
                } else if (attr.type === 'double') {
                    await databases.createFloatAttribute(DB_ID, collectionId, attr.key, attr.required, attr.min, attr.max, attr.default, false);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(DB_ID, collectionId, attr.key, attr.required, attr.default, false);
                }
                process.stdout.write('.');
            } catch (err) {
                // defined as 409 Conflict if attribute exists
                if (err.code !== 409) {
                    console.error(`\nFailed to create attribute ${attr.key}: ${err.message}`);
                }
            }
        }
        console.log('\nAttributes configured.');
    } // end for collections

    console.log('\nSchema setup complete!');
}

setup().catch(err => {
    console.error('Setup failed:', err);
});
