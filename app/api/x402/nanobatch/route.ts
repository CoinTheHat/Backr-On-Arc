import { NextResponse } from 'next/server';
import { parseUnits, formatUnits } from 'viem';
import { db } from '@/utils/db';
import { PLATFORM_TREASURY } from '@/app/utils/constants';

/**
 * Real x402 nanopayments endpoint — Circle Gateway batched settlement.
 *
 * Flow (per Circle Gateway docs, /gateway/nanopayments/howtos/x402-integration):
 *   1. Client POSTs { items: [{receiver, amount, label}, ...] } with no
 *      PAYMENT-SIGNATURE header.
 *   2. We return HTTP 402 + paymentRequirements describing the total amount,
 *      Arc Testnet network, and the GatewayWalletBatched EIP-712 scheme.
 *   3. Client signs an EIP-3009 TransferWithAuthorization against the
 *      GatewayWalletBatched domain (done by @circle-fin/x402-batching/client
 *      + our useNanopay payForContent helper — ONE signature for the entire
 *      batch, no gas).
 *   4. Client retries with `PAYMENT-SIGNATURE: <base64(JSON)>` header.
 *   5. We call BatchFacilitatorClient.settle() → Circle's Gateway API verifies
 *      the signature and commits the funds against the user's on-chain
 *      Gateway balance. Returns success + settlement transaction reference.
 *   6. We persist each sub-item to the tips table as an audit record, then
 *      return 200 with the settlement envelope.
 *
 * Keys the docs did not publish verbatim (USDC address, Gateway Wallet
 * address, facilitator URL) come from `CHAIN_CONFIGS.arcTestnet` at runtime.
 */

export const dynamic = 'force-dynamic';

// Load Circle's Arc config + facilitator client lazily so Next build doesn't
// choke if the packages aren't resolvable at build-time.
async function getFacilitator() {
    const [{ BatchFacilitatorClient }, clientMod, coreHttp] = await Promise.all([
        import('@circle-fin/x402-batching/server'),
        import('@circle-fin/x402-batching/client'),
        // NOTE: the header encoders live in @x402/core/http, not /server. The
        // /server subpath only has resource-server plumbing (x402ResourceServer
        // etc.) — importing encodePaymentRequiredHeader from /server silently
        // returns undefined and the call blows up at runtime, turning the 402
        // into an HTML 500 and making the client choke on "Unexpected end of
        // JSON input".
        import('@x402/core/http'),
    ]);
    const arc = (clientMod as any).CHAIN_CONFIGS.arcTestnet;
    return {
        facilitator: new BatchFacilitatorClient(),
        usdc: arc.usdc as `0x${string}`,
        gatewayWallet: arc.gatewayWallet as `0x${string}`,
        encodePaymentRequiredHeader: (coreHttp as any).encodePaymentRequiredHeader as (req: unknown) => string,
        encodePaymentResponseHeader: (coreHttp as any).encodePaymentResponseHeader as (res: unknown) => string,
    };
}

function buildRequirements(totalAmountAtomic: bigint, usdc: string, gatewayWallet: string, payTo: string) {
    return {
        scheme: 'exact',
        network: 'eip155:5042002',
        asset: usdc,
        amount: totalAmountAtomic.toString(),
        maxTimeoutSeconds: 345600, // 4 days — Gateway rejects < 3 days
        payTo,
        extra: {
            name: 'GatewayWalletBatched',
            version: '1',
            verifyingContract: gatewayWallet,
        },
    };
}

export async function POST(req: Request) {
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }

    const items: Array<{ receiver: string; amount: string; label?: string }> = Array.isArray(body?.items) ? body.items : [];
    const sender: string | undefined = body?.sender;
    if (items.length === 0 || !sender) {
        return NextResponse.json({ error: 'items[] and sender required' }, { status: 400 });
    }

    // Total payment (sum of item amounts, 6-decimal USDC atomic units)
    const totalAtomic = items.reduce((s, it) => s + parseUnits(String(it.amount || '0'), 6), BigInt(0));
    if (totalAtomic <= BigInt(0)) {
        return NextResponse.json({ error: 'total amount must be > 0' }, { status: 400 });
    }

    const { facilitator, usdc, gatewayWallet, encodePaymentRequiredHeader, encodePaymentResponseHeader } = await getFacilitator();
    const payTo: string = body?.payTo || PLATFORM_TREASURY;
    const requirements = buildRequirements(totalAtomic, usdc, gatewayWallet, payTo);
    const paymentRequired = { x402Version: 2, accepts: [requirements] };

    // ---------- Step A: no signature header → return 402 ----------
    const signatureHeader = req.headers.get('PAYMENT-SIGNATURE') || req.headers.get('payment-signature') || req.headers.get('X-PAYMENT');
    if (!signatureHeader) {
        // x402 v2 carries the requirements in a base64 PAYMENT-REQUIRED HEADER,
        // not the JSON body. Clients (x402HTTPClient.getPaymentRequiredResponse)
        // look for the header first; without it they throw
        // "Invalid payment required response".
        return NextResponse.json(
            { error: 'Payment required', ...paymentRequired },
            {
                status: 402,
                headers: {
                    'PAYMENT-REQUIRED': encodePaymentRequiredHeader(paymentRequired),
                },
            },
        );
    }

    // ---------- Step B: signature present → verify + settle ----------
    let payload: any;
    try {
        payload = JSON.parse(Buffer.from(signatureHeader, 'base64').toString('utf-8'));
    } catch {
        return NextResponse.json({ error: 'malformed PAYMENT-SIGNATURE header' }, { status: 402 });
    }

    // Call verify() first for diagnostics — it surfaces an invalidReason we
    // can log before settle() silently returns success:false.
    console.log('[x402/nanobatch] payload keys:', Object.keys(payload || {}));
    console.log('[x402/nanobatch] payload.payload keys:', Object.keys(payload?.payload || {}));
    console.log('[x402/nanobatch] requirements:', JSON.stringify(requirements));
    try {
        const verifyRes = await facilitator.verify(payload, requirements as any);
        console.log('[x402/nanobatch] verify:', verifyRes);
    } catch (e: any) {
        console.error('[x402/nanobatch] verify threw:', e?.message || e);
    }

    let settlement: any;
    try {
        settlement = await facilitator.settle(payload, requirements as any);
        console.log('[x402/nanobatch] settle:', settlement);
    } catch (e: any) {
        console.error('[x402/nanobatch] facilitator.settle threw:', e?.message || e, e?.stack?.slice(0, 500));
        return NextResponse.json(
            { error: 'settlement failed', detail: e.message?.slice(0, 300) },
            { status: 402 },
        );
    }

    if (!settlement?.success) {
        console.warn('[x402/nanobatch] settlement rejected:', settlement);
        return NextResponse.json(
            {
                error: 'Settlement rejected',
                detail: settlement?.errorReason || 'unknown',
                raw: settlement,
            },
            { status: 402 },
        );
    }

    // ---------- Step C: record sub-items in our off-chain ledger ----------
    const settleRef = settlement.transaction || `batch:${Date.now()}`;
    const recorded: any[] = [];
    for (const item of items) {
        try {
            const row = await db.tips.create({
                sender: sender.toLowerCase(),
                receiver: (item.receiver || payTo).toLowerCase(),
                amount: parseFloat(String(item.amount)) || 0,
                currency: 'USDC',
                message: item.label || 'x402 nano-payment',
                txHash: settleRef,
            });
            recorded.push(row);
        } catch (e) {
            console.error('[x402/nanobatch] record sub-item failed', e);
        }
    }

    // x402 spec requires PAYMENT-RESPONSE header as base64(JSON) — use the
    // library's encoder so the client's x402HTTPClient.getPaymentSettleResponse
    // can decode it cleanly.
    const responseHeaders = new Headers({
        'PAYMENT-RESPONSE': encodePaymentResponseHeader({
            success: true,
            payer: settlement.payer,
            transaction: settlement.transaction,
            network: settlement.network,
        }),
    });

    return NextResponse.json(
        {
            success: true,
            totalPaid: formatUnits(totalAtomic, 6),
            settlement: {
                transaction: settlement.transaction,
                payer: settlement.payer,
                network: settlement.network,
            },
            recorded: recorded.length,
            items: recorded,
        },
        { status: 200, headers: responseHeaders },
    );
}
