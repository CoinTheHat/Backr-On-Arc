'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Button from './Button';
import { useEffect, useState } from 'react';
import { Copy, LogOut, Wallet, Plus } from 'lucide-react';
import { useToast } from './Toast';
import { useRouter } from 'next/navigation';

export default function WalletButton({
    className = '',
    style = {},
    size = 'md',
    variant = 'primary',
    transparent = false
}: {
    className?: string,
    style?: React.CSSProperties,
    size?: 'sm' | 'md' | 'lg',
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost',
    transparent?: boolean
}) {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const router = useRouter();
    const { addToast } = useToast();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            addToast('Address copied!', 'success');
        }
    };

    if (!mounted) {
        return (
            <Button
                variant={variant}
                size={size}
                className={`${className} opacity-50 cursor-wait`}
                style={style}
            >
                Loading...
            </Button>
        );
    }

    if (isConnected && address) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Button
                    variant={transparent ? "ghost" : "outline"}
                    size={size}
                    onClick={() => copyAddress()}
                    className={`flex items-center gap-2 font-mono text-xs ${transparent ? 'bg-black/20 text-white hover:bg-black/40 border border-white/20 backdrop-blur-md' : ''}`}
                    style={{ ...style, borderColor: transparent ? 'rgba(255,255,255,0.2)' : 'var(--color-border)' }}
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {formatAddress(address)}
                    <Copy size={12} className={transparent ? "opacity-70" : "opacity-50"} />
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnect()}
                    className={`p-2 ${transparent ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-red-400'}`}
                    title="Logout"
                >
                    <LogOut size={16} />
                </Button>
            </div>
        );
    }

    const handleLogin = () => {
        connect({ connector: injected() });
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                style={style}
            >
                <Wallet size={18} />
                Connect Wallet
            </Button>
        </>
    );
}

function formatAddress(addr: string) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
