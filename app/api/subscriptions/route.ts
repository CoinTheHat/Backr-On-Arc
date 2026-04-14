import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subscriber = searchParams.get('subscriber')?.toLowerCase();
    const creator = searchParams.get('creator')?.toLowerCase();

    try {
        let data;

        if (subscriber && creator) {
            // Filter both: get by user then filter by creator
            data = await db.memberships.getByUser(subscriber);
            data = data.filter((m: any) => m.creatorAddress?.toLowerCase() === creator);
        } else if (subscriber) {
            data = await db.memberships.getByUser(subscriber);
        } else if (creator) {
            data = await db.memberships.getByCreator(creator);
        } else {
            data = await db.memberships.getAll();
        }

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subscriberAddress, creatorAddress, tierId, expiry, txHash } = body;

        if (!subscriberAddress || !creatorAddress) {
            return NextResponse.json({ error: "Missing address" }, { status: 400 });
        }

        const newMembership = await db.memberships.create({
            userAddress: subscriberAddress.toLowerCase(),
            creatorAddress: creatorAddress,
            tierId,
            expiresAt: new Date(expiry * 1000).toISOString(),
            txHash
        });

        return NextResponse.json(newMembership);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
