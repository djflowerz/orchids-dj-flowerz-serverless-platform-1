import { NextResponse } from "next/server";
import { runQueryOnEdge } from "@/lib/firestore-edge";
import { requireAdmin } from "@/lib/auth";

export const runtime = 'edge';

export async function GET(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const query = {
            from: [{ collectionId: 'subscriptions' }],
            orderBy: [{ field: { fieldPath: 'created_at' }, direction: 'DESCENDING' }]
        };

        const subs = await runQueryOnEdge('subscriptions', query);

        // Fetch user details for each subscription
        const formattedSubs = await Promise.all(
            subs.map(async (s) => {
                // Fetch user details
                const userQuery = {
                    from: [{ collectionId: 'users' }],
                    where: {
                        fieldFilter: {
                            field: { fieldPath: 'id' },
                            op: 'EQUAL',
                            value: { stringValue: s.user_id }
                        }
                    },
                    limit: 1
                };
                const users = await runQueryOnEdge('users', userQuery);
                const user = users[0] || {};

                return {
                    id: s.id,
                    user_id: s.user_id,
                    user_name: user.name || user.email || 'Unknown',
                    user_email: s.user_email || user.email,
                    tier: s.tier,
                    status: s.status,
                    start_date: s.start_date,
                    end_date: s.end_date,
                    telegram_channels: s.telegram_channels || [],
                    created_at: s.created_at
                };
            })
        );

        return NextResponse.json(formattedSubs);
    } catch (error: any) {
        console.error("[Subscriptions API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
