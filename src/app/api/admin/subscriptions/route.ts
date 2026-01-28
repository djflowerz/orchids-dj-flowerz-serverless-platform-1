
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const subs = await prisma.subscription.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        // Map to frontend interface
        const formattedSubs = subs.map(s => ({
            id: s.id,
            user_id: s.userId,
            user_name: s.user.name,
            user_email: s.userEmail, // or s.user.email
            tier: s.tier,
            status: s.status,
            start_date: s.startDate.toISOString(),
            end_date: s.endDate.toISOString(),
            telegram_channels: s.telegramChannels,
            created_at: s.createdAt.toISOString()
        }));

        return NextResponse.json(formattedSubs);
    } catch (error: any) {
        console.error("[Subscriptions API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
