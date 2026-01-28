import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRecordingSessions() {
    console.log('🎙️ Seeding recording sessions...');

    const sessions = [
        {
            name: 'Basic Studio Session',
            description: 'Perfect for solo artists and DJs looking to record their first mix. Includes basic equipment and 2 hours of studio time.',
            locationType: 'IN_STUDIO',
            basePrice: 2000,
            hourlyRate: 1000,
            duration: 120,
            equipmentTier: 'BASIC',
            includesEditing: false,
            includesMastering: false,
            maxParticipants: 1,
            isActive: true,
        },
        {
            name: 'Professional Mix Recording',
            description: 'Full professional setup with premium equipment. Includes editing and mastering. Ideal for releasing quality mixes.',
            locationType: 'IN_STUDIO',
            basePrice: 5000,
            hourlyRate: 2000,
            duration: 180,
            equipmentTier: 'PREMIUM',
            includesEditing: true,
            includesMastering: true,
            maxParticipants: 2,
            isActive: true,
        },
        {
            name: 'On-Location Recording',
            description: 'We bring the studio to you! Perfect for live events, parties, or your own space. Includes travel within Nairobi.',
            locationType: 'ON_LOCATION',
            basePrice: 8000,
            hourlyRate: 3000,
            duration: 240,
            equipmentTier: 'STANDARD',
            includesEditing: true,
            includesMastering: false,
            maxParticipants: 3,
            isActive: true,
        },
        {
            name: 'Premium Package - Full Production',
            description: 'The complete package! Extended studio time, premium equipment, full editing, mastering, and consultation. Perfect for serious projects.',
            locationType: 'IN_STUDIO',
            basePrice: 12000,
            hourlyRate: 4000,
            duration: 360,
            equipmentTier: 'PREMIUM',
            includesEditing: true,
            includesMastering: true,
            maxParticipants: 4,
            isActive: true,
        },
        {
            name: 'Remote Collaboration',
            description: 'Work with us remotely! Send your tracks and we\'ll handle the mixing and mastering. Perfect for international collaborations.',
            locationType: 'REMOTE',
            basePrice: 3000,
            hourlyRate: null,
            duration: null,
            equipmentTier: 'STANDARD',
            includesEditing: true,
            includesMastering: true,
            maxParticipants: 1,
            isActive: true,
        },
        {
            name: 'Quick Mix Session',
            description: 'Fast and efficient 1-hour session for experienced DJs. Basic equipment, no editing included.',
            locationType: 'IN_STUDIO',
            basePrice: 1500,
            hourlyRate: 1500,
            duration: 60,
            equipmentTier: 'BASIC',
            includesEditing: false,
            includesMastering: false,
            maxParticipants: 1,
            isActive: true,
        },
    ];

    for (const session of sessions) {
        const existing = await prisma.recordingSession.findFirst({
            where: { name: session.name },
        });

        if (existing) {
            await prisma.recordingSession.update({
                where: { id: existing.id },
                data: session,
            });
            console.log(`✅ Updated: ${session.name}`);
        } else {
            await prisma.recordingSession.create({
                data: session,
            });
            console.log(`✅ Created: ${session.name}`);
        }
    }

    console.log('✨ Recording sessions seeded successfully!');
}

seedRecordingSessions()
    .catch((e) => {
        console.error('❌ Error seeding recording sessions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
