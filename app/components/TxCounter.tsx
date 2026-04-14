'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export default function TxCounter() {
    const [txCount, setTxCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch global counts (tips, memberships, ppv, jobs)
                const res = await fetch('/api/stats/global');
                if (res.ok) {
                    const data = await res.json();
                    setTxCount(data.totalTxns ?? 0);
                }
            } catch {
                // Silently fail - counter is non-critical
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (txCount === null) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg border border-gray-700/50 text-sm">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <Activity className="w-3.5 h-3.5 text-green-400" />
            <span className="font-medium">{txCount} txns on Arc</span>
        </div>
    );
}
