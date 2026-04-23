import { NextResponse } from 'next/server';

/**
 * Keep the free-tier Supabase project from auto-pausing by making a
 * lightweight request every time this endpoint is hit. Point an uptime
 * monitor (UptimeRobot, BetterStack, Railway cron) at this URL every few
 * hours and the project's inactivity timer resets.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        return NextResponse.json({ error: 'supabase not configured' }, { status: 500 });
    }

    const start = Date.now();
    try {
        // Hitting the public storage list endpoint with the anon key counts as
        // project activity on Supabase's side without needing any table reads.
        const res = await fetch(`${url}/storage/v1/bucket`, {
            headers: { apikey: key, authorization: `Bearer ${key}` },
            cache: 'no-store',
        });
        return NextResponse.json({
            ok: res.ok,
            status: res.status,
            ms: Date.now() - start,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'ping failed' }, { status: 500 });
    }
}
