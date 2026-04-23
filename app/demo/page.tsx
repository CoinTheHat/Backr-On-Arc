'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Rocket, Play, CheckCircle, Loader2, Zap, DollarSign, Bot, FileText, ArrowRight, Wallet } from 'lucide-react';
import { useNanopay } from '@/app/hooks/useNanopay';
import { ARC_EXPLORER_URL, PLATFORM_TREASURY } from '@/app/utils/constants';

/** Shape of the successful /api/x402/nanobatch response. */
interface X402Settlement {
    success: boolean;
    totalPaid?: string;
    settlement?: { transaction?: string; payer?: string; network?: string };
    recorded?: number;
}

interface SettlementDetail {
    from: string;
    to: string;
    toName?: string;
    amount: string;
    batchRef: string;
    timestamp: number;
}

interface Step {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    status: 'pending' | 'running' | 'done' | 'error';
    txHash?: string;
    result?: string;
    settlement?: SettlementDetail;
}

/** Nano-payments in this demo — all settled via one Gateway batch signature. */
const NANO_ITEMS: Array<{ id: string; label: string; description: string; amount: string; icon: React.ReactNode }> = [
    { id: 'ppv-1', label: 'PPV Unlock #1', description: 'Unlock premium post ($0.005)', amount: '0.005', icon: <FileText size={16} /> },
    { id: 'ppv-2', label: 'PPV Unlock #2', description: 'Unlock article ($0.003)', amount: '0.003', icon: <FileText size={16} /> },
    { id: 'ppv-3', label: 'PPV Unlock #3', description: 'Micro-content view ($0.001)', amount: '0.001', icon: <FileText size={16} /> },
    { id: 'tip-1', label: 'Tip Creator', description: 'Direct USDC tip ($0.01)', amount: '0.01', icon: <DollarSign size={16} /> },
    { id: 'tip-2', label: 'Nano-Tip', description: 'Nano-tip ($0.005)', amount: '0.005', icon: <DollarSign size={16} /> },
    { id: 'batch', label: 'Batch Nano-Tips ×10', description: '10 rapid $0.001 tips', amount: '0.01', icon: <Zap size={16} /> },
];

export default function DemoPage() {
    const { address, isConnected } = useAccount();
    const { balance, deposit, getBalance, payForContent } = useNanopay();
    const [txCount, setTxCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const [steps, setSteps] = useState<Step[]>([
        { id: 'gateway', label: 'Fund Gateway Balance', description: 'One on-chain USDC deposit to Circle Gateway Wallet', icon: <Wallet size={16} />, status: 'pending' },
        ...NANO_ITEMS.map(i => ({ id: i.id, label: i.label, description: `${i.description} — debited from Gateway balance`, icon: i.icon, status: 'pending' as const })),
        { id: 'agent-1', label: 'AI Agent: Complete Job', description: 'DeepSeek auto-completes an open commission', icon: <Bot size={16} />, status: 'pending' },
    ]);

    const refreshTxCount = async () => {
        try {
            // Bust every cache layer (Next, CDN, browser)
            const r = await fetch('/api/stats/global?t=' + Date.now(), { cache: 'no-store' });
            const d = await r.json();
            setTxCount(d.total ?? d.totalTxns ?? 0);
        } catch {}
    };

    useEffect(() => { refreshTxCount(); }, []);
    useEffect(() => { if (isConnected) getBalance().catch(() => {}); }, [isConnected, getBalance]);

    // Restore step state from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('demo-steps-v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                setSteps(prev => prev.map(s => {
                    const m = parsed.find((p: any) => p.id === s.id);
                    return m ? { ...s, status: m.status, txHash: m.txHash, result: m.result } : s;
                }));
            }
        } catch {}
    }, []);

    const updateStep = (id: string, updates: Partial<Step>) => {
        setSteps(prev => {
            const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
            try {
                localStorage.setItem('demo-steps-v2', JSON.stringify(next.map(s => ({ id: s.id, status: s.status, txHash: s.txHash, result: s.result }))));
            } catch {}
            return next;
        });
    };

    const runDemo = async () => {
        if (!isConnected || !address) return;
        setIsRunning(true);

        // Reset volatile steps
        ['gateway', ...NANO_ITEMS.map(i => i.id), 'agent-1'].forEach(id => updateStep(id, { status: 'pending', txHash: undefined, result: undefined }));

        // ============ STEP 1: Gateway deposit (only if balance < $0.10) ============
        updateStep('gateway', { status: 'running' });
        try {
            // Refresh balance first to avoid stale reads
            let current = 0;
            try { current = parseFloat(await getBalance()); } catch { current = parseFloat(balance ?? '0'); }

            if (current >= 0.1) {
                updateStep('gateway', { status: 'done', result: `Gateway already funded ($${current.toFixed(4)}) — skipping deposit` });
            } else {
                // Try deposit with up to 3 retries for Arc Testnet mempool congestion
                let lastErr: any;
                let depositedTx: string | undefined;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        depositedTx = await deposit('0.5');
                        break;
                    } catch (err: any) {
                        lastErr = err;
                        const msg = String(err?.message || '');
                        const transient = msg.includes('txpool is full') || msg.includes('nonce') || msg.includes('timeout') || msg.includes('replacement');
                        if (!transient || attempt === 3) break;
                        updateStep('gateway', { status: 'running', result: `Arc mempool busy — retrying (${attempt}/3)…` });
                        await new Promise(r => setTimeout(r, 4000 * attempt));
                    }
                }
                if (depositedTx) {
                    updateStep('gateway', { status: 'done', txHash: depositedTx, result: 'Deposited $0.50 to Gateway' });
                    await getBalance().catch(() => {});
                } else {
                    // Re-check balance — deposit may have landed despite the error
                    let postBal = 0;
                    try { postBal = parseFloat(await getBalance()); } catch {}
                    if (postBal >= 0.1) {
                        updateStep('gateway', { status: 'done', result: `Gateway funded ($${postBal.toFixed(4)})` });
                    } else {
                        const raw = String(lastErr?.message || 'Deposit failed');
                        const friendly = raw.includes('txpool is full')
                            ? 'Arc Testnet mempool is full right now. Try again in ~30s, or fund Gateway manually at /nanopayments.'
                            : raw.includes('User rejected')
                            ? 'Deposit cancelled in wallet.'
                            : raw.slice(0, 120);
                        updateStep('gateway', { status: 'error', result: friendly });
                        setIsRunning(false);
                        return;
                    }
                }
            }
        } catch (e: any) {
            updateStep('gateway', { status: 'error', result: e.message?.slice(0, 120) });
            setIsRunning(false);
            return;
        }

        // ============ STEP 2: Pull nanopayments from Gateway balance ============
        // No MetaMask prompt. The deposit already authorized Gateway to debit
        // this user for x402-gated resources; each payment is a server-side
        // settlement against the deposited balance.
        //
        // Recipient strategy: fetch real creators from the DB and rotate
        // through them so every nanopayment goes to an actual creator wallet
        // (not the platform treasury). Falls back to well-known demo
        // addresses when the DB is empty.
        let creators: Array<{ address: string; name?: string }> = [];
        try {
            const r = await fetch('/api/creators?t=' + Date.now(), { cache: 'no-store' });
            const d = await r.json();
            if (Array.isArray(d)) creators = d.filter((c: any) => c?.address && c.address !== address);
        } catch {}

        // No placeholder creators — if the DB has no creators, the demo tells
        // the user to seed it. Every recipient the demo shows is a real row
        // in the creators table.
        if (creators.length === 0) {
            NANO_ITEMS.forEach(it => updateStep(it.id, {
                status: 'error',
                result: 'No creators in DB yet — run scripts/seed_demo.js (or onboard at least one creator) before running the demo.',
            }));
            updateStep('agent-1', { status: 'pending' });
            setIsRunning(false);
            return;
        }
        const pool = creators;
        const pick = (i: number) => pool[i % pool.length];

        const flatItems: Array<{ id: string; receiver: string; amount: string; label: string; receiverName?: string }> = [];
        NANO_ITEMS.forEach((it, idx) => {
            if (it.id === 'batch') {
                for (let i = 0; i < 10; i++) {
                    const r = pick(idx * 10 + i);
                    flatItems.push({ id: `batch-${i}`, receiver: r.address, amount: '0.001', label: `nano-tip ${i + 1}/10 → ${r.name ?? r.address.slice(0, 8)}`, receiverName: r.name });
                }
            } else {
                const r = pick(idx);
                flatItems.push({ id: it.id, receiver: r.address, amount: it.amount, label: `${it.label} → ${r.name ?? r.address.slice(0, 8)}`, receiverName: r.name });
            }
        });

        // ============ REAL x402 CALL ============
        // POST to our x402-gated endpoint. payForContent handles the full
        // flow: first request gets HTTP 402, EIP-712 batch signature is
        // constructed by @circle-fin/x402-batching BatchEvmScheme, request
        // retries with PAYMENT-SIGNATURE header, backend calls Circle's
        // BatchFacilitatorClient.settle() and returns the settlement
        // envelope. One MetaMask signature prompt for the whole batch; zero
        // gas; recorded against the user's Gateway deposit on-chain.
        let x402Result: X402Settlement | null = null;
        let x402Error: string | null = null;
        try {
            const { data, amount: paidAmount } = await payForContent<X402Settlement>(
                '/api/x402/nanobatch',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: { sender: address, items: flatItems },
                },
            );
            x402Result = data;
            console.log('[demo] x402 settlement', { paidAmount, data });
        } catch (e: any) {
            x402Error = e?.message?.slice(0, 200) || 'x402 payment failed';
            console.error('[demo] x402 error', e);
        }

        const rawSettlementTx = x402Result?.settlement?.transaction;
        // Only treat it as a real on-chain tx hash if it actually looks like one
        // (0x-prefixed 32-byte hex). Our fallback emits local-verify:<hex> and
        // Circle sometimes returns UUIDs that ArcScan can't resolve. Don't
        // present those as on-chain txs.
        const isOnChainHash = typeof rawSettlementTx === 'string' && /^0x[a-fA-F0-9]{64}$/.test(rawSettlementTx);
        const settlementTx = isOnChainHash ? rawSettlementTx : undefined;
        const batchRef = rawSettlementTx || `batch:${Date.now()}`;

        // Animate each nano-step completion with settlement details
        for (const it of NANO_ITEMS) {
            updateStep(it.id, { status: 'running' });
            await new Promise(r => setTimeout(r, 300));

            if (x402Error) {
                updateStep(it.id, { status: 'error', result: `x402 settlement failed: ${x402Error.slice(0, 80)}` });
                continue;
            }

            const itemForStep = flatItems.find(f => f.id === it.id || f.id === `batch-0`);
            const settlement: SettlementDetail = {
                from: address as string,
                to: itemForStep?.receiver ?? PLATFORM_TREASURY,
                toName: itemForStep?.receiverName,
                amount: it.id === 'batch' ? '0.01' : it.amount,
                batchRef,
                timestamp: Date.now(),
            };
            if (it.id === 'batch') {
                updateStep(it.id, { status: 'done', result: `10/10 nano-tips split across ${pool.length} creators ($0.01 total)`, settlement, txHash: settlementTx });
            } else {
                const name = itemForStep?.receiverName ?? `${settlement.to.slice(0, 8)}…`;
                updateStep(it.id, { status: 'done', result: `Debited $${it.amount} → ${name}`, settlement, txHash: settlementTx });
            }
            refreshTxCount();
        }

        await refreshTxCount();

        // ============ STEP 4: Autonomous AI agent ============
        updateStep('agent-1', { status: 'running' });
        try {
            const res = await fetch('/api/agent/auto-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (data.success) {
                updateStep('agent-1', { status: 'done', result: `Completed: "${data.job?.title}"` });
            } else {
                updateStep('agent-1', { status: 'done', result: data.error || 'No open jobs' });
            }
        } catch (e: any) {
            updateStep('agent-1', { status: 'error', result: e.message?.slice(0, 60) });
        }

        await refreshTxCount();
        setIsRunning(false);
    };

    const resetDemo = () => {
        setSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const, txHash: undefined, result: undefined })));
        localStorage.removeItem('demo-steps-v2');
        refreshTxCount();
    };

    const completedSteps = steps.filter(s => s.status === 'done').length;
    const nanoCount = NANO_ITEMS.reduce((n, i) => n + (i.id === 'batch' ? 10 : 1), 0);

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                        <Rocket size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Backr Live Demo</h1>
                    <p className="text-slate-500">One Gateway deposit — then {nanoCount} nanopayments pulled silently from your Gateway balance. No per-payment prompts.</p>
                </div>

                {/* Stats Bar */}
                <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-3xl font-bold text-indigo-600">{txCount}</p>
                        <p className="text-xs text-slate-500 font-medium">Total Transactions</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-emerald-600">{completedSteps}/{steps.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Steps Completed</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-amber-600">${balance ?? '—'}</p>
                        <p className="text-xs text-slate-500 font-medium">Gateway Balance</p>
                    </div>
                </div>

                {/* Economic Proof Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 mb-8">
                    <h3 className="font-bold mb-2">Why this only works with nanopayments</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">$2.50</p>
                            <p className="text-xs opacity-80">ETH Mainnet gas</p>
                            <p className="text-xs text-red-300 font-bold">-49,900% margin</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">$0.05</p>
                            <p className="text-xs opacity-80">L2 gas</p>
                            <p className="text-xs text-red-300 font-bold">-900% margin</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center border border-white/30">
                            <p className="text-2xl font-bold">$0.00</p>
                            <p className="text-xs opacity-80">Arc + x402</p>
                            <p className="text-xs text-emerald-300 font-bold">+100% margin</p>
                        </div>
                    </div>
                </div>

                {/* Run Button */}
                {!isRunning && (
                    <div className="flex gap-3 mb-8">
                        <button
                            onClick={runDemo}
                            disabled={!isConnected}
                            className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 text-lg"
                        >
                            <Play size={24} />
                            {completedSteps > 0 ? `Run Again (1 deposit → ${nanoCount} gasless nanopayments)` : `Run Full Demo (1 deposit → ${nanoCount} gasless nanopayments)`}
                        </button>
                        {completedSteps > 0 && (
                            <button
                                onClick={resetDemo}
                                className="px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                )}

                {!isConnected && (
                    <div className="bg-amber-50 text-amber-800 rounded-2xl p-4 mb-8 text-center font-medium text-sm">
                        Connect your wallet on Arc Testnet to run the demo
                    </div>
                )}

                {/* Steps */}
                <div className="space-y-3">
                    {steps.map((step) => (
                        <div key={step.id} className={`bg-white rounded-xl p-4 border transition-all ${
                            step.status === 'running' ? 'border-indigo-300 shadow-md' :
                            step.status === 'done' ? 'border-emerald-200' :
                            step.status === 'error' ? 'border-red-200' :
                            'border-slate-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    step.status === 'running' ? 'bg-indigo-100 text-indigo-600' :
                                    step.status === 'done' ? 'bg-emerald-100 text-emerald-600' :
                                    step.status === 'error' ? 'bg-red-100 text-red-600' :
                                    'bg-slate-100 text-slate-400'
                                }`}>
                                    {step.status === 'running' ? <Loader2 size={18} className="animate-spin" /> :
                                     step.status === 'done' ? <CheckCircle size={18} /> :
                                     step.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-slate-900">{step.label}</p>
                                    <p className="text-xs text-slate-500">{step.description}</p>
                                    {step.result && <p className="text-xs text-slate-600 mt-1 font-medium">{step.result}</p>}
                                </div>
                                {step.txHash && (
                                    <a href={`${ARC_EXPLORER_URL}/tx/${step.txHash}`} target="_blank" rel="noopener noreferrer"
                                       className="text-xs text-indigo-600 hover:underline shrink-0">
                                        View TX
                                    </a>
                                )}
                            </div>

                            {/* Settlement detail panel — proof this payment was recorded */}
                            {step.settlement && (
                                <div className="mt-3 ml-13 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-600 space-y-0.5">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-400">from</span>
                                        <span className="truncate">{step.settlement.from.slice(0, 10)}…{step.settlement.from.slice(-6)}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-400">to</span>
                                        <span className="truncate">{step.settlement.to.slice(0, 10)}…{step.settlement.to.slice(-6)}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-400">amount</span>
                                        <span className="text-emerald-700 font-bold">${step.settlement.amount} USDC</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-400">batch</span>
                                        <span className="truncate text-indigo-600">{step.settlement.batchRef.slice(0, 30)}…</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-400">settled</span>
                                        <span>{new Date(step.settlement.timestamp).toISOString()}</span>
                                    </div>
                                    <div className="flex justify-between gap-3 pt-1 border-t border-slate-200 mt-1">
                                        <span className="text-slate-400">rail</span>
                                        <span className="text-indigo-600">
                                            {step.txHash
                                                ? 'Batched on-chain USDC settlement · x402 authorized'
                                                : 'Settlement pending — see error'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-slate-400">
                    <p>Deposit settles on Arc Testnet. Nano-payments are batched off-chain via Circle Gateway + x402.</p>
                    <a href={ARC_EXPLORER_URL} target="_blank" rel="noopener noreferrer"
                       className="text-indigo-500 hover:underline">
                        View on ArcScan <ArrowRight size={12} className="inline" />
                    </a>
                </div>
            </div>
        </div>
    );
}
