import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const job = await db.jobs.getById(id);
    if (!job) return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    return NextResponse.json(job);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, address, submissionResult, txHash } = body;

        const job = await db.jobs.getById(id);
        if (!job) return NextResponse.json({ error: 'Commission not found' }, { status: 404 });

        let updates: any = {};

        switch (action) {
            case 'accept':
                // Creator accepts the commission request
                if (job.status !== 'open') return NextResponse.json({ error: 'Commission not open' }, { status: 400 });
                updates = { status: 'claimed', txHash };
                break;
            case 'submit':
                // Creator submits the deliverable
                if (job.status !== 'claimed') return NextResponse.json({ error: 'Commission not accepted yet' }, { status: 400 });
                updates = { status: 'submitted', submissionResult, txHash };
                break;
            case 'complete':
                // Supporter approves the deliverable, funds released
                if (job.status !== 'submitted') return NextResponse.json({ error: 'Commission not submitted' }, { status: 400 });
                updates = { status: 'completed', txHash };
                break;
            case 'reject':
                // Supporter rejects the deliverable
                if (job.status !== 'submitted') return NextResponse.json({ error: 'Commission not submitted' }, { status: 400 });
                updates = { status: 'rejected', txHash };
                break;
            // Legacy support
            case 'claim':
                if (job.status !== 'open') return NextResponse.json({ error: 'Commission not open' }, { status: 400 });
                updates = { status: 'claimed', claimedBy: address, txHash };
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updated = await db.jobs.update(id, updates);
        return NextResponse.json(updated);
    } catch (e: any) {
        console.error("Commission Update Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
