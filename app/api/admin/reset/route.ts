import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

/**
 * Wipes demo-relevant tables so the platform shows a clean slate. Intended
 * for video demos where we want to reset back to zero before recording.
 *
 * Protected with a secret token. Set ADMIN_RESET_TOKEN in env and call:
 *   POST /api/admin/reset   with header  x-admin-token: <ADMIN_RESET_TOKEN>
 */
export async function POST(req: Request) {
    const token = req.headers.get('x-admin-token');
    const expected = process.env.ADMIN_RESET_TOKEN;

    if (!expected || !token || token !== expected) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: process.env.POSTGRES_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    });

    const summary: Record<string, number> = {};
    try {
        // Order matters for FKs
        const tables = [
            'ppv_purchases',
            'comments',
            'tips',
            'memberships',
            'jobs',
            'posts',
            'tiers',
            'creators',
        ];
        for (const t of tables) {
            try {
                const res = await pool.query(`DELETE FROM ${t}`);
                summary[t] = res.rowCount ?? 0;
            } catch (e: any) {
                summary[t] = -1;
                console.error(`[reset] ${t} error:`, e.message);
            }
        }
        return NextResponse.json({ success: true, deleted: summary });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'reset failed' }, { status: 500 });
    } finally {
        await pool.end().catch(() => {});
    }
}
