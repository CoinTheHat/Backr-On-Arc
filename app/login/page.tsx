'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Rocket, Wallet, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { isConnected } = useAccount();
    const { connect, isPending } = useConnect();
    const [error, setError] = useState<string | null>(null);

    // Redirect if already connected
    useEffect(() => {
        if (isConnected) {
            router.replace('/');
        }
    }, [isConnected, router]);

    const handleWalletConnect = async () => {
        setError(null);
        try {
            connect({ connector: injected() });
        } catch (err: any) {
            console.error('Wallet connect error:', err);
            setError('Failed to connect wallet. Please try again.');
        }
    };

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4">
            {/* Background Effects (Light) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#cbd5e1_0%,transparent_50%)] opacity-30" />
            <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-[radial-gradient(circle_at_50%_100%,#f1f5f9_0%,transparent_30%)] opacity-60" />

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-all">

                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-xl shadow-slate-200 rotate-12 transition-transform hover:rotate-0 duration-300">
                        <Rocket size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to Backr</h1>
                    <p className="mt-2 text-sm text-slate-500">Connect your wallet to get started</p>
                </div>

                {/* Connect Button */}
                <div className="space-y-4">
                    <button
                        onClick={handleWalletConnect}
                        disabled={isPending}
                        className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0f172a] py-4 text-white shadow-lg shadow-slate-100 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Wallet className="h-5 w-5" />
                        )}
                        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        Connect with MetaMask, WalletConnect, or any injected wallet.
                    </p>

                    {error && <p className="text-center text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
                </div>

            </div>

            <div className="relative z-10 mt-8 text-center text-sm text-slate-500 hover:text-slate-800 transition-colors">
                <Link href="/" className="flex items-center justify-center gap-2">
                    <span>&larr; Return to Home</span>
                </Link>
            </div>
        </main>
    );
}
