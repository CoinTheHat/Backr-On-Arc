import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const creator = searchParams.get('creator');
    const status = searchParams.get('status');
    const claimant = searchParams.get('claimant');

    try {
        if (creator) {
            const jobs = await db.jobs.getByCreator(creator);
            return NextResponse.json(jobs);
        }
        const jobs = await db.jobs.getAll(status || undefined);
        if (claimant) {
            const filtered = jobs.filter((j: any) =>
                j.claimedBy && j.claimedBy.toLowerCase() === claimant.toLowerCase()
            );
            return NextResponse.json(filtered);
        }
        return NextResponse.json(jobs);
    } catch (e: any) {
        console.error("Jobs GET Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { creatorAddress, title, description, budget, txHash, onchainId } = body;

        if (!creatorAddress || !title || !budget) {
            return NextResponse.json({ error: 'creatorAddress, title, and budget required' }, { status: 400 });
        }

        const job = await db.jobs.create({
            onchainId: onchainId || null,
            creatorAddress,
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
