'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useNanopay } from '@/app/hooks/useNanopay';
import { Zap, Wallet, TrendingUp, ArrowLeft, Loader2, CheckCircle, AlertCircle, ExternalLink, Upload, Download, RefreshCw, Clock } from 'lucide-react';
import { ARC_EXPLORER_URL } from '@/app/utils/constants';

export default function NanopaymentsPage() {
    const { isConnected } = useAccount();
    const { balance, deposit, withdraw: gwWithdraw, getBalance, isLoading, error, pendingDeposits } = useNanopay();

    const [depositAmt, setDepositAmt] = useState('5');
    const [withdrawAmt, setWithdrawAmt] = useState('');
    const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
    const [gwWithdrawTxHash, setGwWithdrawTxHash] = useState<string | null>(null);
    const [depositError, setDepositError] = useState<string | null>(null);
    const [gwWithdrawError, setGwWithdrawError] = useState<string | null>(null);
    const [gwWithdrawing, setGwWithdrawing] = useState(false);

    useEffect(() => {
        if (isConnected) getBalance().catch(() => {});
    }, [isConnected, getBalance]);

    const handleDeposit = async () => {
        setDepositError(null);
        setDepositTxHash(null);
        try {
            const hash = await deposit(depositAmt);
            setDepositTxHash(hash as string);
            setTimeout(() => getBalance(), 2000);
        } catch (err: any) {
            setDepositError(err.message?.slice(0, 120) || 'Deposit failed');
        }
    };

    const handleGatewayWithdraw = async () => {
        if (!withdrawAmt) return;
        setGwWithdrawError(null);
        setGwWithdrawTxHash(null);
        setGwWithdrawing(true);
        try {
            const hash = await gwWithdraw(withdrawAmt);
            setGwWithdrawTxHash(hash as string);
            setTimeout(() => getBalance(), 2000);
        } catch (err: any) {
            const msg = err.message?.includes('User rejected') ? 'Transaction cancelled' : (err.message?.slice(0, 120) || 'Withdrawal failed');
            setGwWithdrawError(msg);
        } finally {
            setGwWithdrawing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6">
                    <ArrowLeft size={14} /> Back
                </Link>

                {/* Hero */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white mb-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Circle Nanopayments</h1>
                            <p className="text-sm opacity-80">Gasless micro-payments on Arc Network</p>
                        </div>
                    </div>
                    <p className="text-sm opacity-90 leading-relaxed mt-4">
                        Deposit USDC once into <strong>Circle Gateway</strong>. Every PPV unlock, nano-tip, commission, and subscription afterward is pulled silently from your Gateway balance — no gas, no wallet prompts. <strong>Works for everyone:</strong> supporters fund micro-content and creators use it to commission other creators or back fellow artists. Creator earnings from your own subscription contract are collected on the <Link href="/dashboard" className="underline">dashboard</Link>.
                    </p>
                </div>

                {/* Gateway Balance */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gateway Balance</p>
                                <button
                                    onClick={() => getBalance()}
                                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Refresh balance"
                                >
                                    <RefreshCw size={12} />
                                </button>
                            </div>
                            <p className="text-4xl font-bold text-slate-900">
                                {isConnected ? (balance !== null ? `$${balance}` : '—') : '$0.00'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">USDC available for gasless nanopayments</p>
                        </div>
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Wallet size={28} />
                        </div>
                    </div>

                    {/* Pending deposits */}
                    {pendingDeposits && pendingDeposits.length > 0 && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-amber-700 animate-pulse" />
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Deposits</p>
                                <span className="ml-auto text-xs font-bold text-amber-900">
                                    +${pendingDeposits.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)} incoming
                                </span>
                            </div>
                            <p className="text-xs text-amber-700 mb-2">
                                Your deposit is in the Arc Testnet mempool. Balance updates automatically once the block confirms — usually under a minute, but congestion can stretch it to several minutes.
                            </p>
                            <ul className="space-y-1">
                                {pendingDeposits.map(p => (
                                    <li key={p.txHash} className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-amber-900">+${p.amount} USDC</span>
                                        <a
                                            href={`${ARC_EXPLORER_URL}/tx/${p.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-amber-700 hover:underline inline-flex items-center gap-1"
                                        >
                                            {p.txHash.slice(0, 10)}…{p.txHash.slice(-6)} <ExternalLink size={10} />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!isConnected && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                            Connect your wallet to see your balance.
                        </div>
                    )}
                </div>

                {/* Deposit */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 mb-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Upload size={18} className="text-indigo-600" /> Deposit USDC to Gateway
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                value={depositAmt}
                                onChange={(e) => setDepositAmt(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 font-bold text-lg"
                                placeholder="5.00"
                                disabled={isLoading || !isConnected}
                            />
                        </div>
                        <button
                            onClick={handleDeposit}
                            disabled={isLoading || !isConnected || !depositAmt}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Depositing</> : <>Deposit</>}
                        </button>
                    </div>
                    <div className="flex gap-2 mb-4">
                        {['1', '5', '10', '25'].map(v => (
                            <button
                                key={v}
                                onClick={() => setDepositAmt(v)}
                                disabled={isLoading || !isConnected}
                                className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors disabled:opacity-50"
                            >
                                ${v}
                            </button>
                        ))}
                    </div>

                    {depositTxHash && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-sm">
                            <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold text-emerald-800">Deposit successful!</p>
                                <a href={`${ARC_EXPLORER_URL}/tx/${depositTxHash}`} target="_blank" rel="noopener noreferrer"
                                   className="text-emerald-700 hover:underline inline-flex items-center gap-1 text-xs mt-1">
                                    View on ArcScan <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    )}
                    {(depositError || error) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm">
                            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                            <p className="text-red-800">{depositError || error}</p>
                        </div>
                    )}
                </div>

                {/* Withdraw */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 mb-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Download size={18} className="text-purple-600" /> Withdraw USDC from Gateway
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                        Pull unused USDC back to your MetaMask wallet.
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                value={withdrawAmt}
                                onChange={(e) => setWithdrawAmt(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 font-bold text-lg"
                                placeholder="Amount"
                                disabled={gwWithdrawing || !isConnected}
                            />
                        </div>
                        <button
                            onClick={handleGatewayWithdraw}
                            disabled={gwWithdrawing || !isConnected || !withdrawAmt}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {gwWithdrawing ? <><Loader2 size={18} className="animate-spin" /> Withdrawing</> : <>Withdraw</>}
                        </button>
                    </div>
                    {balance && parseFloat(balance) > 0 && (
                        <button
                            onClick={() => setWithdrawAmt(balance)}
                            className="text-xs text-purple-600 font-bold hover:underline"
                        >
                            Withdraw all (${balance})
                        </button>
                    )}

                    {gwWithdrawTxHash && (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-sm">
                            <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold text-emerald-800">Withdrawal initiated!</p>
                                <a href={`${ARC_EXPLORER_URL}/tx/${gwWithdrawTxHash}`} target="_blank" rel="noopener noreferrer"
                                   className="text-emerald-700 hover:underline inline-flex items-center gap-1 text-xs mt-1">
                                    View on ArcScan <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    )}
                    {gwWithdrawError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm">
                            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                            <p className="text-red-800">{gwWithdrawError}</p>
                        </div>
                    )}
                </div>

                {/* What's routed where */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
                    <h3 className="font-bold text-slate-900 mb-4">What Gets Debited From Your Gateway</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <p className="font-bold text-indigo-900 mb-2">Silent (Gateway)</p>
                            <ul className="space-y-1 text-indigo-800 text-xs">
                                <li>• PPV post unlocks</li>
                                <li>• Nano-tips to creators</li>
                                <li>• Micro-content views</li>
                            </ul>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="font-bold text-amber-900 mb-2">MetaMask (On-chain)</p>
                            <ul className="space-y-1 text-amber-800 text-xs">
                                <li>• Tier subscriptions</li>
                                <li>• ERC-8183 commissions</li>
                                <li>• Gateway deposit / withdraw</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">How Nanopayments Work</h3>
                    <ol className="space-y-3 text-sm text-slate-600">
                        <li className="flex gap-3">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">1</span>
                            <span>Deposit USDC above (one on-chain transaction). This funds your Gateway balance.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">2</span>
                            <span>Browse PPV content. When you unlock a $0.001 post, your wallet signs an EIP-712 message offchain (no gas).</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">3</span>
                            <span>Circle Gateway batches hundreds of signed payments into one onchain settlement, crediting creators automatically.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">4</span>
                            <span>Top up or withdraw unused funds anytime.</span>
                        </li>
                    </ol>
                </div>

                {/* Quick Tip */}
                <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm text-indigo-800">
                    <p className="flex items-center gap-2">
                        <TrendingUp size={16} />
                        <strong>Pro tip:</strong> Ask the AI agent — say "deposit $5 to gateway" or "withdraw $2".
                    </p>
                </div>
            </div>
        </div>
    );
}
