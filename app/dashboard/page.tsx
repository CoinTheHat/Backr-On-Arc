'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import RevenueChart from '../components/RevenueChart';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/format';
import {
    Wallet,
    Users,
    TrendingUp,
    MoreHorizontal,
    UserPlus,
    CheckCircle,
    MessageSquare,
    Briefcase,
    Bot,
    Zap,
    ArrowRight,
    XCircle,
    FileText,
    Crown,
    Play,
    TrendingDown
} from 'lucide-react';
import Link from 'next/link';

export default function StudioOverview() {
    const { address } = useAccount();
    const router = useRouter();

    const [isCreator, setIsCreator] = useState<boolean | null>(null);
    const [memberships, setMemberships] = useState<any[]>([]);
    const [unlockedPosts, setUnlockedPosts] = useState<any[]>([]);

    const [stats, setStats] = useState<{
        totalRevenue: number;
        activeMembers: number;
        monthlyRecurring: number;
        history: any[];
    }>({
        totalRevenue: 0,
        activeMembers: 0,
        monthlyRecurring: 0,
        history: [],
    });
    const [activity, setActivity] = useState<any[]>([]);

    // Detect creator status
    useEffect(() => {
        if (!address) return;
        fetch(`/api/creators?address=${address}`)
            .then(r => r.json())
            .then(d => {
                const isDeployed = !!(d?.contractAddress && d.contractAddress !== '0x0000000000000000000000000000000000000000');
                setIsCreator(isDeployed);
            })
            .catch(() => setIsCreator(false));
    }, [address]);

    // Fetch supporter-specific data
    useEffect(() => {
        if (!address || isCreator !== false) return;
        fetch(`/api/subscriptions?subscriber=${address}`)
            .then(r => r.json())
            .then(d => setMemberships(Array.isArray(d) ? d : []))
            .catch(() => {});
    }, [address, isCreator]);

    useEffect(() => {
        if (!address) return;

        // Fetch Stats
        fetch(`/api/stats?creator=${address.toLowerCase()}`)
            .then(res => res.json())
            .then(data => {
                if (data) setStats({
                    totalRevenue: data.totalRevenue || 0,
                    activeMembers: data.activeMembers || 0,
                    monthlyRecurring: data.monthlyRecurring || 0,
                    history: data.history || [],
                });
            })
            .catch(err => console.error('Failed to fetch stats', err));

        // Fetch Activity (Recent Tips)
        fetch(`/api/tips?receiver=${address.toLowerCase()}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const mappedTips = data.map(t => ({
                        id: `tip-${t.id}`,
                        type: 'tip',
                        title: 'New Tip Received',
                        description: `Received ${t.amount} ${t.currency || 'USDC'} from ${t.sender.slice(0, 6)}...`,
                        timestamp: new Date(t.timestamp),
                        icon: <CheckCircle size={20} />,
                        color: 'bg-emerald-50 text-emerald-600'
                    }));
                    setActivity(prev => {
                        const existing = new Set(prev.map(p => p.id));
                        const newItems = mappedTips.filter(t => !existing.has(t.id));
                        return [...prev, ...newItems].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
                    });
                }
            })
            .catch(err => console.error('Failed to fetch tips', err));

        // Fetch Activity (Recent Subscriptions)
        fetch(`/api/audience?creator=${address.toLowerCase()}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const mappedSubs = data.map(s => ({
                        id: `sub-${s.id}`,
                        type: 'sub',
                        title: 'New Member Joined',
                        description: `${s.subscriberName || s.username || 'A supporter'} subscribed to your content`,
                        timestamp: new Date(s.createdAt || s.startDate),
                        icon: <UserPlus size={20} />,
                        color: 'bg-blue-50 text-blue-600'
                    }));
                    setActivity(prev => {
                        const existing = new Set(prev.map(p => p.id));
                        const newItems = mappedSubs.filter(s => !existing.has(s.id));
                        return [...prev, ...newItems].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
                    });
                }
            })
            .catch(err => console.error('Failed to fetch subscriptions', err));

    }, [address]);

    const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    // Loading state
    if (isCreator === null) {
        return <div className="py-20 text-center text-slate-400">Loading...</div>;
    }

    // ===================== SUPPORTER DASHBOARD =====================
    if (!isCreator) {
        return (
            <div className="space-y-8">
                <section>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back!</h1>
                    <p className="text-slate-500">Track your memberships, unlocked content, and nanopayments balance.</p>
                </section>

                {/* Supporter quick actions */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/explore" className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                            <Users size={18} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mb-1">Explore Creators</h3>
                        <p className="text-xs text-slate-500">Discover creators on the platform</p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
                            Browse <ArrowRight size={12} />
                        </div>
                    </Link>

                    <Link href="/feed" className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-purple-300 hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3">
                            <FileText size={18} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mb-1">My Feed</h3>
                        <p className="text-xs text-slate-500">Latest posts from creators you follow</p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-purple-600 group-hover:gap-2 transition-all">
                            Open Feed <ArrowRight size={12} />
                        </div>
                    </Link>

                    <Link href="/nanopayments" className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                            <Zap size={18} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mb-1">Nanopayments</h3>
                        <p className="text-xs text-slate-500">Deposit USDC for gasless micro-payments</p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">
                            Manage <ArrowRight size={12} />
                        </div>
                    </Link>
                </section>

                {/* Active Memberships */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Your Memberships</h2>
                    {memberships.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-200 text-center">
                            <Crown size={32} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 mb-4">You haven't subscribed to any creators yet</p>
                            <Link href="/explore" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800">
                                Explore Creators <ArrowRight size={14} />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {memberships.slice(0, 6).map((m: any) => (
                                <Link
                                    key={m.id}
                                    href={`/${m.creatorUsername || m.creatorAddress}`}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3"
                                >
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                                        {(m.creatorAvatar || m.creatorProfileImage) ? (
                                            <img src={m.creatorAvatar || m.creatorProfileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Crown size={20} className="text-indigo-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{m.creatorName || 'Creator'}</p>
                                        <p className="text-xs text-slate-500">Expires {new Date(m.expiresAt).toLocaleDateString()}</p>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-400" />
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* My Commission Requests */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">My Commission Requests</h2>
                    <MyCommissions address={address} />
                </section>

                {/* Become a creator CTA */}
                <section className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Crown size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">Become a Creator</h3>
                            <p className="text-sm opacity-90 mb-4">Deploy your own subscription contract on Arc and start earning USDC from supporters.</p>
                            <Link href="/onboarding" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-full text-sm font-bold hover:bg-indigo-50">
                                Get Started <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // ===================== CREATOR DASHBOARD =====================
    return (
        <div className="space-y-8">

            {/* WELCOME SECTION */}
            <section>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, Creator.</h1>
                <p className="text-slate-500">Here is what's happening with your studio today.</p>
            </section>

            {/* PLATFORM FEATURES SHOWCASE */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Platform Features</h2>
                        <p className="text-sm text-slate-500">Everything you can do on Backr</p>
                    </div>
                    <Link href="/demo" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors">
                        <Play size={14} /> Run Live Demo
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Subscription Tiers */}
                    <Link href="/dashboard/membership" className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <Crown size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">Subscription Tiers</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">Create monthly membership tiers stored on-chain. Supporters pay USDC, 95% goes to you.</p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
                            Manage Tiers <ArrowRight size={12} />
                        </div>
                    </Link>

                    {/* Pay-Per-View Posts */}
                    <Link href="/community/new-post" className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-purple-300 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <FileText size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">Pay-Per-View Posts</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">Charge $0.001-$0.01 per article view using Circle Nanopayments. Gasless for supporters.</p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-purple-600 group-hover:gap-2 transition-all">
                            Create PPV Post <ArrowRight size={12} />
                        </div>
                    </Link>

                    {/* Nanopayments */}
                    <Link href="/nanopayments" className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Zap size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">Circle Nanopayments</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">Gasless micro-payments via x402. Deposit once to Gateway, pay $0.001 per view forever.</p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">
                            Deposit to Gateway <ArrowRight size={12} />
                        </div>
                    </Link>

                    {/* Content Commissions */}
                    <Link href="/dashboard/jobs" className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-amber-300 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                <Briefcase size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">Content Commissions</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">Accept paid custom content requests from supporters, or delegate tasks to AI agents. Escrowed on-chain via ERC-8183.</p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-amber-600 group-hover:gap-2 transition-all">
                            Manage Commissions <ArrowRight size={12} />
                        </div>
                    </Link>

                    {/* AI Assistant */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                                <Bot size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">AI Assistant</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">DeepSeek-powered chat agent. Ask anything, get navigation shortcuts to any feature.</p>
                        <div className="mt-3 text-xs font-bold text-sky-600">
                            Click the bubble &rarr;
                        </div>
                    </div>

                    {/* Margin Proof */}
                    <Link href="/about/gas-comparison" className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-2xl hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <TrendingDown size={18} />
                            </div>
                            <h3 className="font-bold text-sm">Why Arc + Nanopayments?</h3>
                        </div>
                        <p className="text-xs opacity-90 leading-relaxed">ETH: -49,900% margin. Arc + x402: +100% margin. See the economic proof.</p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold group-hover:gap-2 transition-all">
                            View Comparison <ArrowRight size={12} />
                        </div>
                    </Link>
                </div>
            </section>

            {/* STATS GRID */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Wallet size={24} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">+12%</span>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-slate-900">{formatPrice(stats.totalRevenue)}</p>
                    </div>
                </div>

                {/* Members Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">+5 new</span>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Active Members</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.activeMembers}</p>
                    </div>
                </div>

                {/* Growth Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-bold text-white bg-primary px-3 py-1 rounded-full">Pro</span>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">MRR (Est.)</p>
                        <p className="text-3xl font-bold text-slate-900">{formatPrice(stats.monthlyRecurring)}</p>
                    </div>
                </div>
            </section>

            {/* CHART SECTION */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Revenue Trend</h3>
                        <p className="text-sm text-slate-400 mt-1">Past 30 days performance</p>
                    </div>
                    <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                        <button onClick={() => {}} className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:bg-white hover:shadow-sm transition-all">7D</button>
                        <button onClick={() => {}} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white text-primary shadow-sm">30D</button>
                        <button onClick={() => {}} className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:bg-white hover:shadow-sm transition-all">ALL</button>
                    </div>
                </div>

                <div className="h-64 w-full bg-gradient-to-b from-primary/5 to-transparent rounded-2xl border border-dashed border-primary/10 flex items-center justify-center relative overflow-hidden">
                    {stats.history && stats.history.length > 0 ? (
                        <RevenueChart data={stats.history} />
                    ) : (
                        <div className="text-center">
                            <p className="text-slate-400 font-medium">No revenue data yet</p>
                            <button onClick={() => router.push('/community/manage-tiers')} className="mt-4 text-primary text-sm font-bold hover:underline">
                                Create first tier
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ACTIVITY FEED */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                    <button onClick={() => router.push('/dashboard/earnings')} className="text-primary text-sm font-bold hover:underline">View All</button>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-50">
                    {activity.length > 0 ? (
                        activity.map((item) => (
                            <div key={item.id} className="p-5 flex items-center gap-5 hover:bg-slate-50 transition-colors cursor-pointer first:rounded-t-3xl last:rounded-b-3xl">
                                <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                                </div>
                                <span className="text-xs font-bold text-slate-400">{formatRelativeTime(item.timestamp)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center">
                            <p className="text-slate-400">No recent activity found.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

// Supporter's outgoing commission requests component
function MyCommissions({ address }: { address: string | undefined }) {
    const [commissions, setCommissions] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchCommissions = () => {
        if (!address) return;
        fetch(`/api/jobs?requester=${address}`)
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setCommissions(d); })
            .catch(() => {})
            .finally(() => setLoaded(true));
    };

    useEffect(() => {
        fetchCommissions();
    }, [address]);

    const handleAction = async (commissionId: number, action: string) => {
        const actionKey = `${commissionId}-${action}`;
        setActionLoading(actionKey);
        try {
            const res = await fetch(`/api/jobs/${commissionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                fetchCommissions();
            } else {
                const err = await res.json();
                alert(err.error || `Failed to ${action} commission`);
            }
        } catch (e) {
            console.error(`${action} error:`, e);
            alert(`Failed to ${action} commission.`);
        } finally {
            setActionLoading(null);
        }
    };

    if (!loaded) return null;

    const statusColors: Record<string, string> = {
        open: 'bg-blue-100 text-blue-700',
        claimed: 'bg-amber-100 text-amber-700',
        submitted: 'bg-purple-100 text-purple-700',
        completed: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    };

    const statusLabels: Record<string, string> = {
        open: 'Waiting for creator',
        claimed: 'Creator working on it',
        submitted: 'Review deliverable',
        completed: 'Completed',
        rejected: 'Declined',
    };

    if (commissions.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-200 text-center">
                <Briefcase size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-2">No commission requests yet</p>
                <p className="text-xs text-slate-400">Visit a creator's profile to request custom content</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {commissions.map((c: any) => (
                <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Briefcase size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{c.title}</p>
                            <p className="text-xs text-slate-500">${c.budget} USDC • {new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[c.status] || 'bg-slate-100 text-slate-600'}`}>
                            {statusLabels[c.status] || c.status}
                        </span>
                    </div>

                    {/* Supporter action buttons when deliverable is submitted */}
                    {c.status === 'submitted' && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            {c.submissionResult && (
                                <div className="mb-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Deliverable</span>
                                    {c.submissionResult}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleAction(c.id, 'complete')}
                                    disabled={actionLoading === `${c.id}-complete`}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle size={14} />
                                    {actionLoading === `${c.id}-complete` ? 'Processing...' : 'Approve & Release USDC'}
                                </button>
                                <button
                                    onClick={() => handleAction(c.id, 'revise')}
                                    disabled={actionLoading === `${c.id}-revise`}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    <ArrowRight size={14} />
                                    {actionLoading === `${c.id}-revise` ? 'Processing...' : 'Request Revision'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Reject this deliverable and refund USDC?')) {
                                            handleAction(c.id, 'reject');
                                        }
                                    }}
                                    disabled={actionLoading === `${c.id}-reject`}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    <XCircle size={14} />
                                    {actionLoading === `${c.id}-reject` ? 'Processing...' : 'Reject & Refund'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
