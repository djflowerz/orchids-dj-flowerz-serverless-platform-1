
import { NextResponse } from "next/server";
import { getDocument, updateDocumentOnEdge, createDocumentOnEdge } from "@/lib/firestore-edge";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { uid, packId } = await req.json();

        if (!uid || !packId) {
            return NextResponse.json({ error: "Missing uid or packId" }, { status: 400 });
        }

        // Get subscription data
        // Assuming subscription ID matches UID for simplicity, or we might need to query
        // The original code used `db.collection("subscriptions").doc(uid)` which implies user ID is the doc ID for subscription?
        // Let's assume yes.
        const subData = await getDocument(`subscriptions/${uid}`);

        if (!subData || subData.status !== "active") {
            return NextResponse.json({ error: "Subscription inactive" }, { status: 403 });
        }

        const downloadsUsed = subData.downloadsUsed !== undefined ? parseInt(subData.downloadsUsed) : 0;
        const downloadLimit = subData.downloadLimit !== undefined ? parseInt(subData.downloadLimit) : 0;

        // Check download limit
        if (downloadsUsed >= downloadLimit) {
            return NextResponse.json({
                error: "Download limit reached",
                used: downloadsUsed,
                limit: downloadLimit
            }, { status: 429 });
        }

        // Sequential Update (No Transaction Support in Edge Client yet)
        // 1. Update Sub
        await updateDocumentOnEdge('subscriptions', uid, {
            downloadsUsed: downloadsUsed + 1
        });

        // 2. Log Download
        await createDocumentOnEdge('downloads', {
            uid,
            packId,
            timestamp: new Date().toISOString(),
            ip: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({
            success: true,
            remaining: downloadLimit - downloadsUsed - 1
        });
    } catch (error: any) {
        console.error("[Download API] Error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}
