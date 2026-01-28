
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let settings = await prisma.siteSettings.findUnique({
            where: { id: "site" }
        });

        if (!settings) {
            // Create default settings if not exists
            settings = await prisma.siteSettings.create({
                data: {
                    id: "site",
                    maintenanceMode: false,
                    autoSyncEnabled: true
                }
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

        // Remove id from body to prevent overwrite errors (though id is fixed)
        const { id, ...data } = body;

        const settings = await prisma.siteSettings.upsert({
            where: { id: "site" },
            update: data,
            create: {
                id: "site",
                ...data
            }
        });

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("[Settings API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
