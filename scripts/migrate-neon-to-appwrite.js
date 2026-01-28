const { PrismaClient } = require('@prisma/client');
const { Client, Databases, Storage, ID, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Initialize Prisma (Neon)
const prisma = new PrismaClient();

// Initialize Appwrite
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = 'dj_flowerz_db';

async function migrateProducts() {
    console.log('\n--- Migrating Products ---');
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        // include: { store: true } // If needed
    });
    console.log(`Found ${products.length} products in Neon.`);

    for (const product of products) {
        try {
            // Check if exists (using title as rough unique key or just create w/ random ID)
            // Appwrite createDocument needs a unique ID. We can use product.id if it fits 36 chars valid chars.
            // Prisma UUIDs are valid.

            const payload = {
                title: product.name,
                description: product.description || '',
                price: parseFloat(product.price.toString()),
                image: product.images && product.images.length > 0 ? product.images[0] : '', // Take first image
                category: product.category || 'Uncategorized',
                isDigital: false // Schema default doesn't handle logic, set explicitly
            };

            if (product.fileUrl) {
                payload.downloadUrl = product.fileUrl;
            }

            await databases.createDocument(
                DB_ID,
                'products',
                product.id, // Use same ID
                payload
            );
            process.stdout.write('+');
        } catch (err) {
            if (err.code === 409) {
                process.stdout.write('.'); // Already exists
            } else {
                console.error(`\nFailed to migrate product ${product.name}:`, err.message);
            }
        }
    }
    console.log('\nProducts migration complete.');
}

async function migrateMixtapes() {
    console.log('\n--- Migrating Mixtapes ---');
    const mixtapes = await prisma.mixtape.findMany();
    console.log(`Found ${mixtapes.length} mixtapes in Neon.`);

    for (const item of mixtapes) {
        try {
            const payload = {
                title: item.title,
                description: item.description || '',
                coverImage: item.coverImage,
                mixLink: item.mixLink || '', // Assuming mixLink is the stream URL
                price: parseFloat(item.price.toString()),
                isFree: item.isFree || false
            };

            await databases.createDocument(
                DB_ID,
                'mixtapes',
                item.id,
                payload
            );
            process.stdout.write('+');
        } catch (err) {
            if (err.code === 409) process.stdout.write('.');
            else console.error(`\nFailed to migrate mixtape ${item.title}:`, err.message);
        }
    }
    console.log('\nMixtapes migration complete.');
}

async function main() {
    try {
        await migrateProducts();
        await migrateMixtapes();
        // Add valid calls for User, Orders etc if schema matches
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
