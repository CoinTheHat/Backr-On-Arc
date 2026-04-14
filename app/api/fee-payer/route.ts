import { NextResponse } from 'next/server';

// Fee payer is disabled on Arc Network.
// Arc uses USDC as native gas token, so no separate fee payer is needed.
export async function POST() {
    return NextResponse.json({
        jsonrpc: '2.0',
        id: null,
        error: {
            code: -32601,
            name: 'MethodNotAvailable',
            message: 'Fee payer is not needed on Arc Network. Gas is paid in USDC natively.',
        },
    }, { status: 410 });
}
