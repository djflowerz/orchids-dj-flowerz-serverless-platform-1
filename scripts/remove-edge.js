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

        // Remove edge runtime export
        if (content.includes("export const runtime = 'edge'")) {
            content = content.replace(/\n*export const runtime = ['"]edge['"];?\n*/g, '\n');
            fs.writeFileSync(fullPath, content);
            console.log(`Removed edge runtime from ${filePath}`);
        } else {
            console.log(`Skipping ${filePath} (no edge runtime found)`);
        }
    } else {
        console.warn(`File not found: ${filePath}`);
    }
});

console.log('\nEdge runtime declarations removed successfully!');
