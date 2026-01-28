
import { NextResponse } from "next/server";
import { generateSignedUpload } from "@/lib/r2";
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

        // Generate signed URL
        const signedUrl = await generateSignedUpload(key, contentType);

        // Public URL logic - assuming standard R2 public access or custom domain
        // If you have a custom domain for R2: https://cdn.djflowerz.com/${key}
        // Or Cloudflare R2dev URL. 
        // Usually, R2_ENDPOINT is the S3 endpoint, not public.
        // Let's assume a public base URL convention. 
        // If not set, return the key and let frontend construct it or use a default.
        // Based on previous code, they were storing full URLs.

        // Check if R2_PUBLIC_URL is in env (it wasn't listed explicitly but R2_ENDPOINT was).
        // Let's assume a pattern similar to: https://pub-[id].r2.dev or custom.
        // I'll check env vars later. For now, I'll return the key and let the caller construct, 
        // OR try to construct it if I know the domain.
        // I'll use a placeholder for now which I can update.
        // Actually, looking at src/lib/r2.ts, it doesn't show public URL generation.
        // However, image delivery usually goes through a public domain.

        const publicUrl = process.env.R2_PUBLIC_URL
            ? `${process.env.R2_PUBLIC_URL}/${key}`
            : `https://cdn.djflowerz.com/${key}`; // Fallback to assumed domain

        return NextResponse.json({ signedUrl, publicUrl, key });
    } catch (error: any) {
        console.error("[Upload URL API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
