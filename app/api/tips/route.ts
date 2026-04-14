import { NextResponse } from 'next/server';
import { db } from '../../../utils/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sender, receiver, amount, message, txHash } = body;

        if (!sender || !receiver || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newTip = await db.tips.create({
            sender,
            receiver,
            amount,
            message,
            txHash
        });

        return NextResponse.json(newTip);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create tip' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const receiver = searchParams.get('receiver');
    const sender = searchParams.get('sender');

    try {
        let tips;
        if (receiver) {
            tips = await db.tips.getByReceiver(receiver);
        } else if (sender) {
            tips = await db.tips.getBySender(sender);
        } else {
            tips = await db.tips.getAll();
        }

        return NextResponse.json(tips);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 });
    }
}
