
import { NextResponse } from "next/server";
import { generateSignedDownload } from "@/lib/r2";
import { getDocument } from "@/lib/firestore-edge";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { uid, fileKey } = await req.json();

        if (!uid || !fileKey) {
            return NextResponse.json({ error: "Missing uid or fileKey" }, { status: 400 });
        }

        // Verify user has active subscription
        const subData = await getDocument(`subscriptions/${uid}`);

        if (!subData || subData.status !== "active") {
            // Optional: Allow admin or one-time purchases? 
            // Original code strictly checked subscription.
            return NextResponse.json({ error: "Subscription required" }, { status: 403 });
        }

        // Generate time-limited signed URL
        const url = await generateSignedDownload(fileKey);

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("[R2 Download API] Error:", error);
        return NextResponse.json({
            error: "Failed to generate download URL",
            details: error.message
        }, { status: 500 });
    }
}
