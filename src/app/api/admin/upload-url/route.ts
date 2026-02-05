
import { NextResponse } from "next/server";
import { generateStorageSignedUpload } from "@/lib/storage-edge";
import { requireAdmin } from "@/lib/auth";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType, folder = 'misc' } = await req.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: "Filename and content type required" }, { status: 400 });
        }

        // Clean filename
        const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '-');
        const key = `${folder}/${Date.now()}-${cleanName}`;

        // Generate signed Upload URL (GCS V4)
        const signedUrl = await generateStorageSignedUpload(key, contentType);

        // Public URL for GCS (Note: This might be private, but the key allows generating a download link later)
        // If the bucket is public, it serves here. If private, we rely on signed download URLs.
        // We'll return the GCS direct link for reference.
        const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        const publicUrl = `https://storage.googleapis.com/${bucket}/${key}`;

        return NextResponse.json({ signedUrl, publicUrl, key });
    } catch (error: any) {
        console.error("[Upload URL API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
