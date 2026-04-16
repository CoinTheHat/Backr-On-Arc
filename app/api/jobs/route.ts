import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const creator = searchParams.get('creator');
    const requester = searchParams.get('requester');
    const status = searchParams.get('status');

    try {
        if (creator) {
            // Commissions addressed TO this creator
            const jobs = await db.jobs.getByCreator(creator);
            return NextResponse.json(jobs);
        }
        if (requester) {
            // Commissions requested BY this supporter
            const jobs = await db.jobs.getByRequester(requester);
            return NextResponse.json(jobs);
        }
        // All commissions (optionally filtered by status)
        const jobs = await db.jobs.getAll(status || undefined);
        return NextResponse.json(jobs);
    } catch (e: any) {
        console.error("Jobs GET Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { requesterAddress, creatorAddress, title, description, budget, txHash, onchainId } = body;

        if (!requesterAddress || !creatorAddress || !title || !budget) {
            return NextResponse.json(
                { error: 'requesterAddress, creatorAddress, title, and budget required' },
                { status: 400 }
            );
        }

        const job = await db.jobs.create({
            onchainId: onchainId || null,
            creatorAddress,
            requesterAddress,
            title,
            description: description || '',
            budget,
            txHash: txHash || null
        });

        return NextResponse.json(job);
    } catch (e: any) {
        console.error("Jobs POST Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
