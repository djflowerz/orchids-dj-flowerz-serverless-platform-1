import { NextResponse } from "next/server";
import { generateSignedDownload } from "@/lib/r2";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { uid, fileKey } = await req.json();

        if (!uid || !fileKey) {
            return NextResponse.json({ error: "Missing uid or fileKey" }, { status: 400 });
        }

        const { db } = await import("@/lib/firebase-admin");

        if (!db) {
            return NextResponse.json({ error: "DB not initialized" }, { status: 500 });
        }

        // Verify user has active subscription
        const subRef = db.collection("subscriptions").doc(uid);
        const subSnap = await subRef.get();

        if (!subSnap.exists || subSnap.data()?.status !== "active") {
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
