import { NextResponse } from "next/server";

export const runtime = 'edge'; // Cloudflare Pages requires edge runtime (use nodejs_compat flag in settings)

export async function POST(req: Request) {
    try {
        const { uid, packId } = await req.json();

        if (!uid || !packId) {
            return NextResponse.json({ error: "Missing uid or packId" }, { status: 400 });
        }

        const { db } = await import("@/lib/firebase-admin");

        if (!db) {
            console.error("[Download API] Firebase Admin DB not initialized");
            return NextResponse.json({ error: "Internal Server Error - DB init failed" }, { status: 500 });
        }

        // Get subscription data
        const subRef = db.collection("subscriptions").doc(uid);
        const subSnap = await subRef.get();

        if (!subSnap.exists || subSnap.data()?.status !== "active") {
            return NextResponse.json({ error: "Subscription inactive" }, { status: 403 });
        }

        const subData = subSnap.data()!;
        const { downloadsUsed = 0, downloadLimit = 0 } = subData;

        // Check download limit
        if (downloadsUsed >= downloadLimit) {
            return NextResponse.json({
                error: "Download limit reached",
                used: downloadsUsed,
                limit: downloadLimit
            }, { status: 429 });
        }

        const firestore = db;
        // Use transaction to ensure atomicity
        await firestore.runTransaction(async (tx) => {
            tx.update(subRef, {
                downloadsUsed: downloadsUsed + 1
            });

            tx.set(firestore.collection("downloads").doc(), {
                uid,
                packId,
                timestamp: new Date(),
                ip: req.headers.get('x-forwarded-for') || 'unknown'
            });
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
