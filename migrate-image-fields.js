/**
 * Migration Script: Rename coverImage to cover_image
 * 
 * This script migrates existing documents in Firestore to use the correct
 * snake_case field names for images instead of camelCase.
 * 
 * Run with: node migrate-image-fields.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
let serviceAccount;

// Try to load service account from environment
if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
        const jsonStr = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(jsonStr);
        console.log('✅ Loaded service account from FIREBASE_SERVICE_ACCOUNT_B64');
    } catch (error) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_B64:', error.message);
        process.exit(1);
    }
} else {
    console.error('❌ No Firebase service account found!');
    console.log('Please set FIREBASE_SERVICE_ACCOUNT_B64 in .env.local');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function migrateCollection(collectionName, fieldMapping) {
    console.log(`\n🔄 Migrating ${collectionName}...`);

    try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
            console.log(`   ℹ️  No documents found in ${collectionName}`);
            return { updated: 0, skipped: 0 };
        }

        let updated = 0;
        let skipped = 0;
        const batch = db.batch();
        let batchCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            let needsUpdate = false;
            const updates = {};

            // Check each field mapping
            for (const [oldField, newField] of Object.entries(fieldMapping)) {
                if (data[oldField] !== undefined && data[newField] === undefined) {
                    updates[newField] = data[oldField];
                    updates[oldField] = admin.firestore.FieldValue.delete();
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                batch.update(doc.ref, updates);
                batchCount++;
                updated++;

                // Firestore batch limit is 500 operations
                if (batchCount >= 500) {
                    await batch.commit();
                    console.log(`   ✅ Committed batch of ${batchCount} updates`);
                    batchCount = 0;
                }
            } else {
                skipped++;
            }
        }

        // Commit remaining updates
        if (batchCount > 0) {
            await batch.commit();
            console.log(`   ✅ Committed final batch of ${batchCount} updates`);
        }

        console.log(`   ✅ ${collectionName}: ${updated} updated, ${skipped} skipped`);
        return { updated, skipped };
    } catch (error) {
        console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
        return { updated: 0, skipped: 0, error: error.message };
    }
}

async function runMigration() {
    console.log('🚀 Starting image field migration...\n');
    console.log('This will rename:');
    console.log('  - coverImage → cover_image');
    console.log('  - imageUrl → image_url');
    console.log('  - audioUrl → audio_url');
    console.log('  - videoUrl → video_url\n');

    const results = {};

    // Migrate mixtapes
    results.mixtapes = await migrateCollection('mixtapes', {
        coverImage: 'cover_image',
        audioUrl: 'audio_url',
        videoUrl: 'video_url'
    });

    // Migrate products
    results.products = await migrateCollection('products', {
        imageUrl: 'image_url',
        coverImage: 'cover_image'
    });

    // Migrate music_pool
    results.music_pool = await migrateCollection('music_pool', {
        coverImage: 'cover_image',
        audioUrl: 'audio_url'
    });

    // Migrate blog_posts
    results.blog_posts = await migrateCollection('blog_posts', {
        imageUrl: 'image_url'
    });

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));

    let totalUpdated = 0;
    let totalSkipped = 0;
    let hasErrors = false;

    for (const [collection, result] of Object.entries(results)) {
        totalUpdated += result.updated;
        totalSkipped += result.skipped;
        if (result.error) hasErrors = true;

        console.log(`\n${collection}:`);
        console.log(`  Updated: ${result.updated}`);
        console.log(`  Skipped: ${result.skipped}`);
        if (result.error) console.log(`  Error: ${result.error}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Total Updated: ${totalUpdated}`);
    console.log(`Total Skipped: ${totalSkipped}`);
    console.log('='.repeat(50));

    if (hasErrors) {
        console.log('\n⚠️  Migration completed with errors. Please review above.');
    } else {
        console.log('\n✅ Migration completed successfully!');
    }

    process.exit(hasErrors ? 1 : 0);
}

// Run the migration
runMigration().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
