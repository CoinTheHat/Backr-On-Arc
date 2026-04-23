'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { type Address, formatUnits } from 'viem';
import { Crown, Wallet, Download, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { ARC_EXPLORER_URL, TOKENS } from '@/app/utils/constants';
import { SUBSCRIPTION_CONTRACT_ABI } from '@/app/utils/abis';

/**
 * Creator earnings card: reads USDC balance in the creator's on-chain
 * subscription contract and allows withdrawal (5% platform fee applied
 * on-chain by the contract). Used on the creator dashboard.
 */
export default function CreatorEarnings() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const [creatorContract, setCreatorContract] = useState<string | null>(null);
    const [pendingEarnings, setPendingEarnings] = useState<string | null>(null);
    const [withdrawing, setWithdrawing] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!address) return;
        fetch(`/api/creators?address=${address}`)
            .then(r => r.json())
            .then(d => {
                if (d?.contractAddress && d.contractAddress !== '0x0000000000000000000000000000000000000000') {
                    setCreatorContract(d.contractAddress);
                }
            }).catch(() => {});
    }, [address]);

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

    const handleWithdraw = async () => {
        if (!walletClient || !creatorContract) return;
        setWithdrawing(true);
        setError(null);
        setTxHash(null);
        try {
            const hash = await walletClient.writeContract({
                address: creatorContract as Address,
                abi: SUBSCRIPTION_CONTRACT_ABI,
                functionName: 'withdraw',
                args: [],
            });
            setTxHash(hash);
            setTimeout(() => refreshEarnings(), 3000);
        } catch (err: any) {
            const msg = err.message?.includes('User rejected') ? 'Transaction cancelled' : (err.message?.slice(0, 120) || 'Withdraw failed');
            setError(msg);
        } finally {
            setWithdrawing(false);
        }
    };

    if (!creatorContract) return null;

    const hasEarnings = pendingEarnings !== null && parseFloat(pendingEarnings) > 0;
    const earningsAfterFee = hasEarnings ? (parseFloat(pendingEarnings!) * 0.95).toFixed(4) : '0';
    const feeAmount = hasEarnings ? (parseFloat(pendingEarnings!) * 0.05).toFixed(4) : '0';

    return (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl">
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
                onClick={handleWithdraw}
                disabled={!hasEarnings || withdrawing}
                className="w-full bg-white text-emerald-700 font-bold py-3 rounded-xl hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
                {withdrawing ? (
                    <><Loader2 size={18} className="animate-spin" /> Withdrawing...</>
                ) : (
                    <><Download size={18} /> Withdraw to My Wallet</>
                )}
            </button>

            {txHash && (
                <div className="mt-3 p-2.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle size={14} />
                    <span>Withdrawal successful!</span>
                    <a href={`${ARC_EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="ml-auto underline hover:opacity-80 inline-flex items-center gap-1">
                        View TX <ExternalLink size={10} />
                    </a>
                </div>
            )}
            {error && (
                <div className="mt-3 p-2.5 bg-red-500/20 border border-red-300/30 rounded-lg text-xs">
                    {error}
                </div>
            )}
        </div>
    );
}
