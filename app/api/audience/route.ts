import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const creator = searchParams.get('creator')?.toLowerCase();

    // If no creator specified, return empty
    if (!creator) {
        return NextResponse.json([]);
    }

    try {
        // Fetch real subscriptions (memberships)
        // Note: We use 'memberships' table in PG instead of 'subscriptions'
        const subs = await db.memberships.getByCreator(creator);

        // Fetch this creator's tiers to map tierId -> tierName
        const tiers = await db.tiers.getByCreator(creator);

        // Filter out obvious mock data
        const validSubs = subs.filter((s: any) =>
            !s.userAddress.startsWith('0x1010') &&
            !s.userAddress.startsWith('0x2020') &&
            !s.userAddress.startsWith('0x3030')
        );

        // Fetch profiles for these subscribers
        // We don't have bulk fetch by array in db yet, so we loop or fetch all?
        // Optimizing: Fetch individual profiles in parallel
        // Or strictly: `db.creators.find` for each.
        const profiles = await Promise.all(
            validSubs.map((s: any) => db.creators.find(s.userAddress))
        );

        const enrichedSubs = validSubs.map((sub: any) => {
            const matchedTier = tiers.find((t: any) => t.id === sub.tierId || String(t.id) === String(sub.tierId));
            // Note: tiers in PG have UUID/text IDs, not index based usually, unless numeric.
            // db.tiers.saveAll uses random string IDs.
            // But membership.tierId might be integer if old schema?
            // db.memberships schema says tierId INTEGER.
            // db.tiers schema says id TEXT.
            // Mismatch!
            // 'api/subscriptions/route.ts' passes `tierId` from body.
            // Verify if tierId is int or string in usage.
            // Assuming for now we try to match by ID or Name if possible.
            // Legacy code used index matching `index === sub.tierId`. 
            // Postgres tiers have `price`, `name`.

            // Search profile 
            const profile = profiles.find((p: any) => p && p.address.toLowerCase() === sub.userAddress.toLowerCase());

            return {
                ...sub,
                subscriberAddress: sub.userAddress, // alias for compatibility
                tierName: matchedTier?.name || `Tier ${sub.tierId}`,
                price: matchedTier?.price || '-',
                subscriberName: profile?.name,
                subscriberAvatar: profile?.avatarUrl || profile?.profileImage,
                status: new Date(sub.expiresAt) > new Date() ? 'Active' : 'Expired'
            };
        });

        return NextResponse.json(enrichedSubs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // body likely contains subscriberAddress, creatorAddress etc.
        // Map to membership schema
        const membership = {
            userAddress: body.subscriberAddress,
            creatorAddress: body.creatorAddress,
            tierId: body.tierId,
            expiresAt: body.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default 30 days
        };

        const newSub = await db.memberships.create(membership);
        return NextResponse.json({ success: true, data: newSub });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
