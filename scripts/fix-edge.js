
const fs = require('fs');
const path = require('path');

const files = [
    'src/app/admin/page.tsx',
    'src/app/api/admin/event-bookings/route.ts',
    'src/app/api/admin/settings/route.ts',
    'src/app/api/admin/subscriptions/route.ts',
    'src/app/api/admin/transactions/route.ts',
    'src/app/api/auth/send-otp/route.ts',
    'src/app/api/auth/verify-otp/route.ts',
    'src/app/api/bookings/[id]/route.ts',
    'src/app/api/bookings/route.ts',
    'src/app/api/mixtapes/route.ts',
    'src/app/api/music-pool/route.ts',
    'src/app/api/payments/mpesa/callback/route.ts',
    'src/app/api/payments/mpesa/pay/route.ts',
    'src/app/api/plans/route.ts',
    'src/app/api/recording-sessions/[id]/route.ts',
    'src/app/api/recording-sessions/route.ts',
    'src/app/recording-sessions/[id]/page.tsx',
    'src/app/recording-sessions/page.tsx'
];

files.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);

    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // check if runtime is already exported
        if (content.includes("export const runtime = 'edge'")) {
            console.log(`Skipping ${filePath} (already has edge runtime)`);
            return;
        }

        if (content.includes("export const runtime")) {
            console.log(`Skipping ${filePath} (has other runtime config: ${content.match(/export const runtime = ['"](.+)['"]/)?.[1]})`);
            return;
        }

        // Add it after imports or at top
        // Simplest: append to end, but clean code implies top.
        // Let's prepend after imports if possible, or just append.
        // Appending is safest to avoid breaking imports.

        content += "\n\nexport const runtime = 'edge';\n";
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${filePath}`);
    } else {
        console.warn(`File not found: ${filePath}`);
    }
});
