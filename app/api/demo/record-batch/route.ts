import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

/**
 * Records a batch of nanopayments (signed off-chain via EIP-712) into the tips
 * table so they count toward global transaction stats. In a real x402 flow the
 * Gateway settles these into one on-chain tx; for the demo we record them as
 * individual entries with a shared batch signature reference.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sender, items, signature } = body as {
            sender: string;
            items: Array<{ receiver: string; amount: string; label?: string }>;
            signature: string;
        };

        if (!sender || !Array.isArray(items) || items.length === 0 || !signature) {
            return NextResponse.json({ error: 'bad request' }, { status: 400 });
        }

        const ref = `nanobatch:${signature.slice(0, 18)}`;
        const created: any[] = [];

        for (const item of items) {
            try {
                const row = await db.tips.create({
                    sender,
                    receiver: item.receiver || sender,
                    amount: parseFloat(item.amount) || 0,
                    currency: 'USDC',
                    message: item.label || 'x402 nano-payment',
                    txHash: ref,
                });
                created.push(row);
            } catch (e) {
                // swallow per-item errors — demo shouldn't abort on one bad row
                console.error('[nanobatch] insert error', e);
            }
        }

        return NextResponse.json({ success: true, recorded: created.length });
    } catch (e: any) {
        console.error('[nanobatch] error', e);
        return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
    }
}
