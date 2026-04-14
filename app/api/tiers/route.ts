import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const creator = searchParams.get('creator'); // This is the address

    console.log('🔍 [Tiers API] GET request, creator:', creator);

    if (!creator) {
        return NextResponse.json([]);
    }

    const tiers = await db.tiers.getByCreator(creator);
    console.log('🔍 [Tiers API] Found tiers:', tiers.length, 'for creator:', creator);
    return NextResponse.json(tiers);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { creator, name, price, perks } = body;

        if (!creator || !name || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const currentTiers = await db.tiers.getByCreator(creator);

        const newTier = {
            id: Math.random().toString(36).substr(2, 9),
            creatorAddress: creator,
            name,
            price: Number(price),
            description: body.description || '',
            perks: perks || [],
            image: body.image || '',
            active: true,
            createdAt: new Date().toISOString()
        };

        // saveAll replaces all tiers, so we append the new one
        await db.tiers.saveAll(creator, [...currentTiers, newTier]);

        return NextResponse.json(newTier);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, creator, name, price, perks } = body;

        if (!id || !creator) {
            return NextResponse.json({ error: 'Missing ID or Creator' }, { status: 400 });
        }

        const currentTiers = await db.tiers.getByCreator(creator);
        const tierIndex = currentTiers.findIndex((t: any) => t.id === id);

        if (tierIndex === -1) {
            return NextResponse.json({ error: "Tier not found" }, { status: 404 });
        }

        const updatedTier = {
            ...currentTiers[tierIndex],
            name,
            price: Number(price),
            description: body.description || currentTiers[tierIndex].description,
            perks: perks || [],
            image: body.image || currentTiers[tierIndex].image
        };

        currentTiers[tierIndex] = updatedTier;
        await db.tiers.saveAll(creator, currentTiers);

        return NextResponse.json(updatedTier);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const creator = searchParams.get('creator');

    if (!id || !creator) {
        return NextResponse.json({ error: 'Missing ID or Creator' }, { status: 400 });
    }

    const currentTiers = await db.tiers.getByCreator(creator);
    const filteredTiers = currentTiers.filter((t: any) => t.id !== id);

    await db.tiers.saveAll(creator, filteredTiers);

    return NextResponse.json({ success: true });
}
