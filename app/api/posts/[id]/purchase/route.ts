import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { buyerAddress, txHash } = body;

        if (!buyerAddress || !txHash) {
            return NextResponse.json({ error: 'buyerAddress and txHash required' }, { status: 400 });
        }

        // Check post exists and is PPV
        const post = await db.posts.getById(id);
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        if (!post.ppvEnabled) {
            return NextResponse.json({ error: 'Post is not pay-per-view' }, { status: 400 });
        }

        // Check if already purchased
        const existing = await db.ppvPurchases.getByPostAndBuyer(id, buyerAddress);
        if (existing) {
            return NextResponse.json({ error: 'Already purchased', purchase: existing }, { status: 200 });
        }

        // Record purchase
        const purchase = await db.ppvPurchases.create({
            postId: id,
            buyerAddress,
            amount: post.ppvPrice,
            txHash
        });

        return NextResponse.json({ success: true, purchase });
    } catch (e: any) {
        console.error("PPV Purchase Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
