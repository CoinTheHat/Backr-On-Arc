'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/utils/format';

interface Supporter {
    address: string;
    totalAmount: number;
    rank: number;
}

export default function SupporterLeaderboard({ creatorAddress }: { creatorAddress: string }) {
    const [supporters, setSupporters] = useState<Supporter[]>([]);

    useEffect(() => {
        const fetchTips = async () => {
            try {
                const res = await fetch(`/api/tips?receiver=${creatorAddress}`);
                const tips = await res.json();

                if (Array.isArray(tips)) {
                    // Aggregate tips by sender
                    const totals: Record<string, number> = {};
                    tips.forEach((tip: any) => {
                        const amount = parseFloat(tip.amount || '0');
                        totals[tip.sender] = (totals[tip.sender] || 0) + amount;
                    });

                    // Convert to array and sort
                    const sorted = Object.entries(totals)
                        .map(([address, totalAmount]) => ({ address, totalAmount }))
                        .sort((a, b) => b.totalAmount - a.totalAmount)
                        .slice(0, 10) // Top 10
                        .map((s, i) => ({ ...s, rank: i + 1 }));

                    setSupporters(sorted);
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchTips();
    }, [creatorAddress]);

    if (supporters.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Top Supporters</h3>
            </div>
            <div>
                {supporters.map((s) => (
                    <div key={s.address} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${s.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                    s.rank === 2 ? 'bg-gray-100 text-gray-700' :
                                        s.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                            'bg-white text-gray-400 border border-gray-100'
                                }`}>
                                {s.rank}
                            </div>
                            <span className="font-mono text-sm text-gray-600">
                                {s.address.substring(0, 6)}...{s.address.substring(s.address.length - 4)}
                            </span>
                        </div>
                        <div className="font-bold text-brand-dark">
                            ${s.totalAmount.toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
