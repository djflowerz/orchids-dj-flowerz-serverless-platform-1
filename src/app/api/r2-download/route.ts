
import { NextResponse } from "next/server";
import { generateStorageSignedDownload } from "@/lib/storage-edge";
import { getDocument } from "@/lib/firestore-edge";
import { auth } from "@clerk/nextjs/server";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { userId } = auth(); // Securely get user ID from Clerk headers
        const { fileKey } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!fileKey) {
            return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });
        }

        // Verify user has active subscription
        const subData = await getDocument(`subscriptions/${userId}`);

        if (!subData || subData.status !== "active") {
            return NextResponse.json({ error: "Subscription required" }, { status: 403 });
        }

        // Generate time-limited signed URL (GCS)
        const url = await generateStorageSignedDownload(fileKey);

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("[Download API] Error:", error);
        return NextResponse.json({
            error: "Failed to generate download URL",
            details: error.message
        }, { status: 500 });
    }
}
