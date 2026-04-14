'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Coffee } from 'lucide-react';

interface Tip {
    id: string;
    sender: string;
    amount: string;
    message: string;
    timestamp: string;
}

export default function TipJar({ receiverAddress }: { receiverAddress: string }) {
    const [tips, setTips] = useState<Tip[]>([]);

    useEffect(() => {
        const fetchTips = async () => {
            try {
                const res = await fetch(`/api/tips?receiver=${receiverAddress}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Sort new to old using timestamp string
                    setTips(data.reverse());
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchTips();
        const interval = setInterval(fetchTips, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [receiverAddress]);

    if (tips.length === 0) return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coffee size={20} />
            </div>
            <p className="text-gray-500 text-sm">No tips yet. Be the first!</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Recent Supporters</h3>
                <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">{tips.length}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {tips.map((tip) => (
                    <div key={tip.id} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-xs text-gray-400 truncate max-w-[100px]" title={tip.sender}>
                                {tip.sender.substring(0, 6)}...{tip.sender.substring(tip.sender.length - 4)}
                            </span>
                            <span className="text-xs text-gray-300">
                                {formatDistanceToNow(new Date(tip.timestamp), { addSuffix: true })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-brand-dark">${tip.amount}</span>
                            {tip.amount && parseFloat(tip.amount) >= 10 && <span className="text-xs">🔥</span>}
                        </div>
                        {tip.message && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg mt-1 italic">
                                "{tip.message}"
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
