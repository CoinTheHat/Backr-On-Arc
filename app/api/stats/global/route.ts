import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET() {
    try {
        const stats = await db.stats.getCounts();
        const memberships = await db.memberships.getAll();
        const jobs = await db.jobs.getAll();

        const ppvCount = stats.ppvPurchases || 0;

        const totalTxns =
            (stats.tips || 0) +
            ppvCount +
            (memberships?.length || 0) +
            (jobs?.length || 0);

        return NextResponse.json({
            ppvPurchases: ppvCount,
            tips: stats.tips || 0,
            subscriptions: memberships?.length || 0,
            jobs: jobs?.length || 0,
            totalTxns,
        });
    } catch (error: any) {
        console.error('Global stats error:', error);
        return NextResponse.json({ totalTxns: 0 }, { status: 200 });
    }
}
