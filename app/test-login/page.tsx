'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';

export default function TestLoginPage() {
    const { address, isConnected } = useAccount();
    const { connect, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        console.log('TestLoginPage mounted. Connected:', isConnected);
    }, [isConnected]);

    return (
        <div style={{ padding: 50, background: '#111', color: '#fff', height: '100vh', fontFamily: 'monospace' }}>
            <h1>Wallet Connect Test (Arc Network)</h1>
            <p>Connected: {isConnected ? 'YES' : 'NO'}</p>
            <p>Address: {address || 'N/A'}</p>

            {isConnected && (
                <div style={{ marginTop: 20, padding: 20, border: '1px solid green' }}>
                    <p>CONNECTED: {address}</p>
                    <button onClick={() => disconnect()} style={{ padding: 10, background: 'red', color: 'white' }}>DISCONNECT</button>
                </div>
            )}

            {!isConnected && (
                <div style={{ marginTop: 20 }}>
                    <button
                        onClick={() => connect({ connector: injected() })}
                        disabled={isPending}
                        style={{ padding: 10, fontSize: 16, cursor: 'pointer', background: 'blue', color: 'white' }}
                    >
                        {isPending ? 'CONNECTING...' : 'CONNECT WALLET'}
                    </button>
                </div>
            )}
        </div>
    );
}
