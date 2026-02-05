import { NextResponse } from "next/server";
import { getDocument, updateDocumentOnEdge, createDocumentOnEdge } from "@/lib/firestore-edge";
import { requireAdmin } from "@/lib/auth";

export const runtime = 'edge';

export async function GET() {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let settings = await getDocument('site_settings/site');

        if (!settings) {
            // Create default settings if not exists
            settings = await createDocumentOnEdge('site_settings', {
                id: 'site',
                maintenanceMode: false,
                autoSyncEnabled: true,
                created_at: new Date().toISOString()
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("[Settings API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Remove id from body to prevent overwrite errors
        const { id, ...data } = body;

        // Check if settings exist
        const existing = await getDocument('site_settings/site');

        let settings;
        if (existing) {
            settings = await updateDocumentOnEdge('site_settings', 'site', data);
        } else {
            settings = await createDocumentOnEdge('site_settings', {
                id: 'site',
                ...data,
                created_at: new Date().toISOString()
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("[Settings API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
