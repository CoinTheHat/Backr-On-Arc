import { NextResponse } from 'next/server';
import { db } from '@/utils/db'; // Use db instead of supabase

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
    const resolvedParams = await params;
    const { address } = resolvedParams;

    try {
        const creator = await db.creators.find(address);

        if (!creator) {
            return NextResponse.json({ categoryIds: [], hashtagIds: [] });
        }

        // socials is JSONB, so it comes back as an object
        const taxonomy = creator.socials?.taxonomy || { categoryIds: [], hashtagIds: [] };
        return NextResponse.json(taxonomy);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ address: string }> }) {
    const resolvedParams = await params;
    const { address } = resolvedParams;

    try {
        const body = await request.json();
        const { categoryIds, hashtagIds } = body;

        // 1. Get existing creator
        const creator = await db.creators.find(address);
        if (!creator) {
            return NextResponse.json({ error: "Creator not found" }, { status: 404 });
        }

        // 2. Merge taxonomy into socials
        const currentSocials = creator.socials || {};
        const updatedSocials = {
            ...currentSocials,
            taxonomy: { categoryIds, hashtagIds }
        };

        // 3. Update using db
        const updatedCreator = await db.creators.updateSocials(address, updatedSocials);

        if (!updatedCreator) {
            throw new Error("Failed to update socials");
        }

        return NextResponse.json({ categoryIds, hashtagIds });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
