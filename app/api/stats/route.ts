import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request: Request) {
    // Note: This route is very specific to dashboard stats for a creator.
    const { searchParams } = new URL(request.url);
    const creatorAddress = searchParams.get('creator') || searchParams.get('address');

    if (!creatorAddress) {
        return NextResponse.json({ error: 'Creator address required' }, { status: 400 });
    }

    try {
        // 1. Get ALL memberships (subscriptions)
        const allSubs = await db.memberships.getByCreator(creatorAddress);

        const now = new Date();

        // Filter logic:
        const validSubs = (allSubs || []).filter((sub: any) => {
            const isExpired = new Date(sub.expiresAt) < now;
            const isMock = sub.userAddress.startsWith('0x1010') ||
                sub.userAddress.startsWith('0x2020') ||
                sub.userAddress.startsWith('0x3030');
            return !isExpired && !isMock;
        });

        const membersCount = validSubs.length;

        // 2. Calculate Revenue
        const tiers = await db.tiers.getByCreator(creatorAddress);
        const tips = await db.tips.getByReceiver(creatorAddress);

        let totalRevenue = 0;

        // Add Tip Revenue
        if (tips) {
            tips.forEach((t: any) => {
                totalRevenue += parseFloat(t.amount || '0');
            });
        }

        // Add Subscription Revenue
        if (tiers && validSubs.length > 0) {
            validSubs.forEach((sub: any) => {
                // TierID is string in our DB but might be mapped from index in frontend previously.
                // Simple Match:
                const tier = tiers.find((t: any) => String(t.id) === String(sub.tierId));
                if (tier) {
                    totalRevenue += parseFloat(tier.price || '0');
                } else if (!isNaN(Number(sub.tierId)) && tiers[Number(sub.tierId)]) {
                    // Fallback for index-based IDs (0, 1, 2)
                    totalRevenue += parseFloat(tiers[Number(sub.tierId)].price || '0');
                } else if (sub.tierName) {
                    const t = tiers.find((t: any) => t.name === sub.tierName);
                    if (t) totalRevenue += parseFloat(t.price || '0');
                }
            });
        }

        // 3. Generate Real History
        const historyMap: { [key: string]: number } = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            historyMap[key] = 0;
        }

        // Add Tips to history
        if (tips) {
            tips.forEach((t: any) => {
                const d = new Date(t.timestamp);
                const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
                if (historyMap[key] !== undefined) {
                    historyMap[key] += parseFloat(t.amount || '0');
                }
            });
        }

        // Add Subscriptions to history (estimate based on current tier price)
        validSubs.forEach((sub: any) => {
            const d = new Date(sub.createdAt);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (historyMap[key] !== undefined) {
                const tier = tiers.find((t: any) => String(t.id) === String(sub.tierId));
                // totalRevenue is already calculated for current active subs.
                // This loop is for historical revenue distribution.
                const price = tier ? parseFloat(tier.price || '0') : 0;
                historyMap[key] += price;
            }
        });

        const history = Object.keys(historyMap).map(key => ({
            name: key.split(' ')[0], // Just show month name for display
            revenue: parseFloat(historyMap[key].toFixed(2))
        }));

        // 4. Checklist Data
        const creatorProfile = await db.creators.find(creatorAddress);
        const profileSet = !!(creatorProfile && creatorProfile.name);
        const isDeployed = !!(creatorProfile && creatorProfile.contractAddress);

        const allPosts = await db.posts.getByCreator(creatorAddress);
        const postsCount = allPosts ? allPosts.length : 0;
        const hasPosts = postsCount > 0;
        const activeDiscussions = postsCount; // Approximation

        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const likesThisWeek = (allPosts || [])
            .filter((p: any) => new Date(p.createdAt) > oneWeekAgo)
            .reduce((sum: number, p: any) => sum + (p.likes || 0), 0);

        // Top Tier Members
        let topTierName = '';
        let maxPrice = -1;
        if (tiers) {
            tiers.forEach((t: any) => {
                const p = parseFloat(t.price || '0');
                if (p > maxPrice) {
                    maxPrice = p;
                    topTierName = t.name;
                }
            });
        }

        let topTierMembers = 0;
        if (topTierName) {
            // We need to match validSubs to topTierName
            // This requires tiers mapping again
            topTierMembers = validSubs.filter((sub: any) => {
                const tier = tiers.find((t: any) => String(t.id) === String(sub.tierId));
                return tier?.name === topTierName || sub.tierName === topTierName;
            }).length;
        }

        const hasTiers = (tiers && tiers.length > 0);

        return NextResponse.json({
            contractAddress: creatorProfile?.contractAddress,
            totalRevenue: totalRevenue,
            monthlyRecurring: totalRevenue,
            activeMembers: membersCount,
            history,
            checklist: {
                profileSet,
                isDeployed,
                hasTiers,
                hasPosts
            },
            // Dashboard Stats
            totalBackrs: membersCount,
            activeDiscussions,
            likesThisWeek,
            topTierMembers
        });

    } catch (error: any) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
