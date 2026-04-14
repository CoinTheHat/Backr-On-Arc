'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { type Address, formatUnits } from 'viem';
import Link from 'next/link';
import { useNanopay } from '@/app/hooks/useNanopay';
import { Zap, Wallet, TrendingUp, ArrowLeft, Loader2, CheckCircle, AlertCircle, ExternalLink, Crown, Download, Upload, Users, RefreshCw } from 'lucide-react';
import { ARC_EXPLORER_URL, TOKENS } from '@/app/utils/constants';
import { SUBSCRIPTION_CONTRACT_ABI } from '@/app/utils/abis';

export default function NanopaymentsPage() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { balance, deposit, withdraw: gwWithdraw, getBalance, isLoading, error } = useNanopay();

    // Deposit/withdraw state
    const [depositAmt, setDepositAmt] = useState('5');
    const [withdrawAmt, setWithdrawAmt] = useState('');
    const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
    const [gwWithdrawTxHash, setGwWithdrawTxHash] = useState<string | null>(null);
    const [depositError, setDepositError] = useState<string | null>(null);
    const [gwWithdrawError, setGwWithdrawError] = useState<string | null>(null);
    const [gwWithdrawing, setGwWithdrawing] = useState(false);

    // Creator earnings state
    const [creatorContract, setCreatorContract] = useState<string | null>(null);
    const [pendingEarnings, setPendingEarnings] = useState<string | null>(null);
    const [earningsWithdrawing, setEarningsWithdrawing] = useState(false);
    const [earningsTxHash, setEarningsTxHash] = useState<string | null>(null);
    const [earningsError, setEarningsError] = useState<string | null>(null);

    // Tab state: auto-select based on user status
    const [tab, setTab] = useState<'supporter' | 'creator'>('supporter');

    useEffect(() => {
        if (isConnected) getBalance();
    }, [isConnected, getBalance]);

    // Detect creator status and auto-select tab
    useEffect(() => {
        if (!address) return;
        fetch(`/api/creators?address=${address}`)
            .then(r => r.json())
            .then(d => {
                if (d?.contractAddress && d.contractAddress !== '0x0000000000000000000000000000000000000000') {
                    setCreatorContract(d.contractAddress);
                    setTab('creator'); // Default creators to creator tab
                }
            }).catch(() => {});
    }, [address]);

    // Read creator's contract balance
    const refreshEarnings = useCallback(async () => {
        if (!creatorContract || !publicClient) return;
        try {
            const bal = await publicClient.readContract({
                address: TOKENS.USDC as Address,
                abi: [{
                    inputs: [{ name: 'account', type: 'address' }],
                    name: 'balanceOf',
                    outputs: [{ name: '', type: 'uint256' }],
                    stateMutability: 'view',
                    type: 'function',
                }],
                functionName: 'balanceOf',
                args: [creatorContract as Address],
            }) as bigint;
            setPendingEarnings(formatUnits(bal, 6));
        } catch {}
    }, [creatorContract, publicClient]);

    useEffect(() => { refreshEarnings(); }, [refreshEarnings]);

    // ==== Handlers ====

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

    const handleEarningsWithdraw = async () => {
        if (!walletClient || !creatorContract) return;
        setEarningsWithdrawing(true);
        setEarningsError(null);
        setEarningsTxHash(null);
        try {
            const hash = await walletClient.writeContract({
                address: creatorContract as Address,
                abi: SUBSCRIPTION_CONTRACT_ABI,
                functionName: 'withdraw',
                args: [],
            });
            setEarningsTxHash(hash);
            setTimeout(() => refreshEarnings(), 3000);
        } catch (err: any) {
            const msg = err.message?.includes('User rejected') ? 'Transaction cancelled' : (err.message?.slice(0, 120) || 'Withdraw failed');
            setEarningsError(msg);
        } finally {
            setEarningsWithdrawing(false);
        }
    };

    const hasEarnings = pendingEarnings !== null && parseFloat(pendingEarnings) > 0;
    const earningsAfterFee = hasEarnings ? (parseFloat(pendingEarnings!) * 0.95).toFixed(4) : '0';
    const feeAmount = hasEarnings ? (parseFloat(pendingEarnings!) * 0.05).toFixed(4) : '0';
    const isCreator = !!creatorContract;

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
                        Powered by <strong>Circle Gateway</strong> + <strong>x402 protocol</strong>. Note: this is not Circle Wallets. Nanopayments uses an on-chain Gateway deposit contract where your MetaMask-signed deposits are held for batched settlement.
                    </p>
                </div>

                {/* Tabs (only show if user is a creator) */}
                {isCreator && (
                    <div className="bg-white rounded-2xl p-1 border border-slate-200 mb-6 flex gap-1">
                        <button
                            onClick={() => setTab('creator')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                tab === 'creator' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <Crown size={14} /> Creator
                        </button>
                        <button
                            onClick={() => setTab('supporter')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                tab === 'supporter' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <Users size={14} /> Supporter
                        </button>
                    </div>
                )}

                {/* =========================== CREATOR TAB =========================== */}
                {tab === 'creator' && isCreator && (
                    <>
                        {/* Earnings Card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white mb-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Crown size={18} />
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Creator Earnings</p>
                                    </div>
                                    <p className="text-4xl font-bold">
                                        ${pendingEarnings !== null ? pendingEarnings : '...'}
                                    </p>
                                    <p className="text-xs opacity-80 mt-1">Pending in your subscription contract</p>
                                </div>
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Wallet size={28} />
                                </div>
                            </div>

                            {hasEarnings && (
                                <div className="bg-white/10 rounded-xl p-3 mb-4 text-sm">
                                    <div className="flex justify-between opacity-90">
                                        <span>You receive (95%):</span>
                                        <span className="font-bold">${earningsAfterFee}</span>
                                    </div>
                                    <div className="flex justify-between opacity-70 text-xs mt-1">
                                        <span>Platform fee (5%):</span>
                                        <span>${feeAmount}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleEarningsWithdraw}
                                disabled={!hasEarnings || earningsWithdrawing}
                                className="w-full bg-white text-emerald-700 font-bold py-3 rounded-xl hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                            >
                                {earningsWithdrawing ? (
                                    <><Loader2 size={18} className="animate-spin" /> Withdrawing...</>
                                ) : (
                                    <><Download size={18} /> Withdraw to My Wallet</>
                                )}
                            </button>

                            {earningsTxHash && (
                                <div className="mt-3 p-2.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
                                    <CheckCircle size={14} />
                                    <span>Withdrawal successful!</span>
                                    <a href={`${ARC_EXPLORER_URL}/tx/${earningsTxHash}`} target="_blank" rel="noopener noreferrer" className="ml-auto underline hover:opacity-80">
                                        View TX
                                    </a>
                                </div>
                            )}
                            {earningsError && (
                                <div className="mt-3 p-2.5 bg-red-500/20 border border-red-300/30 rounded-lg text-xs">
                                    {earningsError}
                                </div>
                            )}
                        </div>

                        {/* Creator Info */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Crown size={18} className="text-emerald-600" /> How Creator Earnings Work
                            </h3>
                            <ol className="space-y-3 text-sm text-slate-600">
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">1</span>
                                    <span>Supporters subscribe to your tiers — USDC flows into your on-chain subscription contract.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">2</span>
                                    <span>Earnings accumulate in the contract. View the pending balance above.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">3</span>
                                    <span>Click "Withdraw to My Wallet" — contract auto-applies 5% platform fee, sends 95% to you.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">4</span>
                                    <span>Tips and direct USDC payments land directly in your wallet (instant, no withdrawal needed).</span>
                                </li>
                            </ol>
                        </div>
                    </>
                )}

                {/* =========================== SUPPORTER TAB =========================== */}
                {tab === 'supporter' && (
                    <>
                        {/* Gateway Balance Card */}
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

                            {!isConnected && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                    Connect your wallet to see your balance.
                                </div>
                            )}
                        </div>

                        {/* Deposit Form */}
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

                        {/* Withdraw Form */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 mb-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Download size={18} className="text-purple-600" /> Withdraw USDC from Gateway
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Pull unused USDC back to your MetaMask wallet. Initiates a withdrawal on-chain.
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
                    </>
                )}

                {/* Quick Tip */}
                <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm text-indigo-800">
                    <p className="flex items-center gap-2">
                        <TrendingUp size={16} />
                        <strong>Pro tip:</strong> Ask the AI agent — say "deposit $5 to gateway" or "withdraw my earnings".
                    </p>
                </div>
            </div>
        </div>
    );
}
