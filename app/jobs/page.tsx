'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import SiteFooter from '../components/SiteFooter';
import {
    Briefcase,
    DollarSign,
    Clock,
    CheckCircle,
    Rocket,
    Search,
    User,
    Loader2,
    Inbox,
    ArrowRight,
} from 'lucide-react';

interface Commission {
    id: number;
    title: string;
    description: string;
    budget: string;
    status: string;
    creatorAddress: string;
    requesterAddress?: string;
    createdAt?: string;
    onchainJobId?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Open Request' },
    claimed: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
    submitted: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Delivered' },
    completed: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Completed' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Rejected' },
};

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES.open;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
            {status === 'open' && <Clock size={12} />}
            {status === 'completed' && <CheckCircle size={12} />}
            {style.label}
        </span>
    );
}

function shortenAddress(addr: string) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function CommissionsBoard() {
    const router = useRouter();
    const { address } = useAccount();

    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'mine'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [acceptingId, setAcceptingId] = useState<number | null>(null);

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        try {
            const res = await fetch('/api/jobs');
            const data = await res.json();
            if (Array.isArray(data)) setCommissions(data);
        } catch (e) {
            console.error('Failed to fetch commissions:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (commission: Commission) => {
        if (!address) {
            alert('Please connect your wallet first.');
            return;
        }
        setAcceptingId(commission.id);
        try {
            const res = await fetch(`/api/jobs/${commission.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'accept' }),
            });
            if (res.ok) {
                await fetchCommissions();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to accept commission');
            }
        } catch (e) {
            console.error('Accept error:', e);
            alert('Failed to accept commission');
        } finally {
            setAcceptingId(null);
        }
    };

    const filteredCommissions = commissions.filter((c) => {
        if (filter === 'open' && c.status !== 'open') return false;
        if (filter === 'mine' && c.creatorAddress?.toLowerCase() !== address?.toLowerCase()) return false;
        if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && !c.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const FILTERS = [
        { key: 'all' as const, label: 'All Commissions' },
        { key: 'open' as const, label: 'Open Requests' },
        { key: 'mine' as const, label: 'For Me' },
    ];

    return (
        <div className="min-h-screen bg-mist text-slate-900 font-sans">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <Rocket size={18} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">Backr</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/explore')}
                        className="px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Explore
                    </button>
                    {address ? (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:-translate-y-0.5 shadow-lg shadow-slate-900/20"
                        >
                            Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push('/login')}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:-translate-y-0.5 shadow-lg shadow-slate-900/20"
                        >
                            Get Started
                        </button>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 md:px-10 py-12">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 mb-8 flex items-start gap-3">
                    <Inbox size={22} className="shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-base mb-1">Content Commissions Board</h3>
                        <p className="text-sm leading-relaxed">Browse commission requests from supporters. Supporters pay creators USDC to produce custom content. Funds are escrowed and released on approval.</p>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Inbox size={28} className="text-primary" />
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                            Commission Requests
                        </h1>
                    </div>
                    <p className="text-slate-500 text-lg max-w-xl">
                        Supporters request custom content from creators. If you are the target creator, accept and deliver to earn USDC.
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex gap-2">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                                    filter === f.key
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search commissions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>
                </div>

                {/* Commission Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-primary" />
                    </div>
                ) : filteredCommissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Inbox size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">No commissions found</p>
                        <p className="text-sm mt-1">
                            {filter === 'mine' ? 'No commissions addressed to you yet.' : 'Check back later for new commission requests.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCommissions.map((commission) => {
                            const isTargetCreator = address && commission.creatorAddress?.toLowerCase() === address.toLowerCase();

                            return (
                                <div
                                    key={commission.id}
                                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
                                >
                                    <div className="p-6 flex-1 flex flex-col">
                                        {/* Top row */}
                                        <div className="flex items-start justify-between mb-4">
                                            <StatusBadge status={commission.status} />
                                            <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                                                <DollarSign size={14} className="text-emerald-500" />
                                                {commission.budget} USDC
                                            </div>
                                        </div>

                                        {/* Title & Description */}
                                        <h3
                                            className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-2"
                                            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                        >
                                            {commission.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4 flex-1">
                                            {commission.description}
                                        </p>

                                        {/* Requester & Target Creator */}
                                        <div className="space-y-2 mb-4">
                                            {commission.requesterAddress && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <User size={14} />
                                                    <span>Requested by {shortenAddress(commission.requesterAddress)}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <ArrowRight size={14} />
                                                <span>For creator {shortenAddress(commission.creatorAddress)}</span>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        {commission.status === 'open' && isTargetCreator && (
                                            <button
                                                onClick={() => handleAccept(commission)}
                                                disabled={acceptingId === commission.id}
                                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {acceptingId === commission.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle size={16} />
                                                        Accept Commission
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {commission.status === 'open' && !isTargetCreator && (
                                            <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-slate-50 text-slate-500 text-sm font-medium">
                                                <Clock size={16} />
                                                Awaiting creator response
                                            </div>
                                        )}
                                        {commission.status === 'claimed' && (
                                            <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium">
                                                <Loader2 size={16} />
                                                Creator is working on this
                                            </div>
                                        )}
                                        {commission.status === 'completed' && (
                                            <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-purple-50 text-purple-700 text-sm font-medium">
                                                <CheckCircle size={16} />
                                                Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <SiteFooter />
        </div>
    );
}
