'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useJob } from '../../hooks/useJob';
import SectionHeader from '../../components/SectionHeader';
import {
    Briefcase,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    Loader2,
    Send,
    AlertCircle,
    User,
} from 'lucide-react';

interface Job {
    id: number;
    title: string;
    description: string;
    budget: string;
    status: string;
    creatorAddress: string;
    claimedBy?: string;
    createdAt?: string;
    onchainJobId?: string;
    submission?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Open' },
    claimed: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Claimed' },
    submitted: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Submitted' },
    completed: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Completed' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Rejected' },
};

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES.open;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
            {status === 'open' && <Clock size={12} />}
            {status === 'completed' && <CheckCircle size={12} />}
            {status === 'rejected' && <XCircle size={12} />}
            {style.label}
        </span>
    );
}

function shortenAddress(addr: string) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function DashboardJobsPage() {
    const { address } = useAccount();
    const { createJob, completeJob, rejectJob, isLoading: txLoading, error: txError } = useJob();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [posting, setPosting] = useState(false);

    // Action loading states
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);

    useEffect(() => {
        if (address) fetchJobs();
    }, [address]);

    const fetchJobs = async () => {
        if (!address) return;
        try {
            const res = await fetch(`/api/jobs?creator=${address}`);
            const data = await res.json();
            if (Array.isArray(data)) setJobs(data);
        } catch (e) {
            console.error('Failed to fetch jobs:', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePostJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address || !title || !description || !budget) {
            alert('Please fill in all fields.');
            return;
        }
        setPosting(true);
        try {
            // Create onchain job
            const expiry = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
            const zeroAddr = '0x0000000000000000000000000000000000000000';
            await createJob(zeroAddr, address, expiry, title);

            // Save to API
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    budget,
                    creatorAddress: address,
                    status: 'open',
                }),
            });

            if (res.ok) {
                setTitle('');
                setDescription('');
                setBudget('');
                setShowForm(false);
                await fetchJobs();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save job');
            }
        } catch (e) {
            console.error('Post job error:', e);
            alert('Failed to create job. Check console for details.');
        } finally {
            setPosting(false);
        }
    };

    const handleApprove = async (job: Job) => {
        setApprovingId(job.id);
        try {
            if (job.onchainJobId) {
                await completeJob(BigInt(job.onchainJobId), '0x' as `0x${string}`);
            }
            const res = await fetch(`/api/jobs/${job.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete' }),
            });
            if (res.ok) {
                await fetchJobs();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to approve job');
            }
        } catch (e) {
            console.error('Approve error:', e);
            alert('Failed to approve. Check console for details.');
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async (job: Job) => {
        setRejectingId(job.id);
        try {
            if (job.onchainJobId) {
                await rejectJob(BigInt(job.onchainJobId), '0x' as `0x${string}`);
            }
            const res = await fetch(`/api/jobs/${job.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject' }),
            });
            if (res.ok) {
                await fetchJobs();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to reject job');
            }
        } catch (e) {
            console.error('Reject error:', e);
            alert('Failed to reject. Check console for details.');
        } finally {
            setRejectingId(null);
        }
    };

    return (
        <div className="page-container" style={{ paddingBottom: '60px' }}>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 mb-6 flex items-start gap-3">
                <Briefcase size={22} className="shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-bold text-base mb-1">Content Commissions (ERC-8183)</h3>
                    <p className="text-sm leading-relaxed">Two modes powered by the same on-chain escrow: (1) <strong>Accept commissions</strong> from supporters who pay you USDC to create custom content; (2) <strong>Delegate work</strong> to AI agents — titles, translations, moderation. Funds are escrowed via ERC-8183 on Arc, released only on approval.</p>
                </div>
            </div>
            <SectionHeader
                title="Content Commissions"
                description="Accept custom content requests from supporters or delegate tasks to AI agents."
                action={{
                    label: showForm ? 'Cancel' : 'Post New Job',
                    onClick: () => setShowForm(!showForm),
                    variant: showForm ? 'ghost' : 'primary',
                }}
            />

            {/* Post New Job Form */}
            {showForm && (
                <div className="card-surface" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} className="text-primary" />
                        New Job
                    </h3>
                    <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Design a logo for my community"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the job requirements, deliverables, and timeline..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-vertical"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                Budget (USDC)
                            </label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    placeholder="100"
                                    min="1"
                                    step="any"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                    required
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={posting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {posting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                                {posting ? 'Creating...' : 'Post Job'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Job List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                    <Loader2 size={32} className="animate-spin text-primary" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="card-surface" style={{ padding: '64px 24px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                    <Briefcase size={48} className="mx-auto mb-4 text-slate-300" />
                    <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>No jobs yet</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>Post your first job to get started.</p>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold transition-all hover:opacity-90"
                        >
                            <Plus size={16} />
                            Post New Job
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            className="card-surface"
                            style={{
                                padding: '20px 24px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                            }}
                        >
                            {/* Top row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                        {job.title}
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                                        {job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <StatusBadge status={job.status} />
                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-900">
                                        <DollarSign size={14} className="text-emerald-500" />
                                        {job.budget} USDC
                                    </span>
                                </div>
                            </div>

                            {/* Meta info */}
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                                {job.createdAt && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </span>
                                )}
                                {job.claimedBy && (
                                    <span className="flex items-center gap-1">
                                        <User size={12} />
                                        Claimed by {shortenAddress(job.claimedBy)}
                                    </span>
                                )}
                            </div>

                            {/* Submission & Actions */}
                            {job.status === 'submitted' && (
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                    {job.submission && (
                                        <div style={{ marginBottom: '12px', padding: '12px 16px', background: 'var(--color-bg-page)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>
                                                Submission
                                            </span>
                                            {job.submission}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => handleApprove(job)}
                                            disabled={approvingId === job.id}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {approvingId === job.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <CheckCircle size={16} />
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(job)}
                                            disabled={rejectingId === job.id}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-sm font-bold transition-all hover:bg-rose-100 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {rejectingId === job.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <XCircle size={16} />
                                            )}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
