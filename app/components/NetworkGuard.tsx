'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { arcTestnet } from '@/utils/arc-config';
import { AlertTriangle } from 'lucide-react';

export default function NetworkGuard() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    if (!isConnected || chainId === arcTestnet.id) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
            <AlertTriangle size={18} />
            <span>Wrong network! Please switch to Arc Testnet (Chain ID: 5042002)</span>
            <button
                onClick={() => switchChain({ chainId: arcTestnet.id })}
                className="bg-white text-amber-600 px-4 py-1.5 rounded-full font-bold text-xs hover:bg-amber-50 transition-colors"
            >
                Switch to Arc Testnet
            </button>
        </div>
    );
}
