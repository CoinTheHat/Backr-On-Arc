'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import SectionHeader from '../../components/SectionHeader';
import {
    Briefcase,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Send,
    User,
    Inbox,
} from 'lucide-react';

interface Commission {
    id: number;
    title: string;
    description: string;
    budget: string;
    status: string;
    creatorAddress: string;
    requesterAddress?: string;
    claimedBy?: string;
    createdAt?: string;
    onchainJobId?: string;
    submissionResult?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'New Request' },
    claimed: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
    submitted: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Awaiting Approval' },
    completed: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Completed' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Rejected' },
};

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES.open;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
            {status === 'open' && <Clock size={12} />}
            {status === 'claimed' && <Loader2 size={12} />}
            {status === 'submitted' && <Send size={12} />}
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

export default function DashboardCommissionsPage() {
    const { address } = useAccount();

    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);

    // Action loading states
    const [acceptingId, setAcceptingId] = useState<number | null>(null);
    const [submittingId, setSubmittingId] = useState<number | null>(null);

    // Deliverable input per commission
    const [deliverables, setDeliverables] = useState<Record<number, string>>({});

    useEffect(() => {
        if (address) fetchCommissions();
    }, [address]);

    const fetchCommissions = async () => {
        if (!address) return;
        try {
            const res = await fetch(`/api/jobs?creator=${address}`);
            const data = await res.json();
            if (Array.isArray(data)) setCommissions(data);
        } catch (e) {
            console.error('Failed to fetch commissions:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (commission: Commission) => {
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
            alert('Failed to accept commission.');
        } finally {
            setAcceptingId(null);
        }
    };

    const handleSubmitDeliverable = async (commission: Commission) => {
        const deliverable = deliverables[commission.id];
        if (!deliverable?.trim()) {
            alert('Please describe or link your deliverable.');
            return;
        }
        setSubmittingId(commission.id);
        try {
            const res = await fetch(`/api/jobs/${commission.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'submit', submissionResult: deliverable }),
            });
            if (res.ok) {
                setDeliverables(prev => ({ ...prev, [commission.id]: '' }));
                await fetchCommissions();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit deliverable');
            }
        } catch (e) {
            console.error('Submit error:', e);
            alert('Failed to submit deliverable.');
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="page-container" style={{ paddingBottom: '60px' }}>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 mb-6 flex items-start gap-3">
                <Inbox size={22} className="shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-bold text-base mb-1">Incoming Commissions</h3>
                    <p className="text-sm leading-relaxed">Supporters can request custom content from you and offer USDC as payment. Accept a request, create the content, submit your deliverable, and get paid when the supporter approves.</p>
                </div>
            </div>

            <SectionHeader
                title="Content Commissions"
                description="Custom content requests from your supporters. Accept, deliver, and get paid."
            />

            {/* Commission List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                    <Loader2 size={32} className="animate-spin text-primary" />
                </div>
            ) : commissions.length === 0 ? (
                <div className="card-surface" style={{ padding: '64px 24px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                    <Inbox size={48} className="mx-auto mb-4 text-slate-300" />
                    <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>No commissions yet</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>When supporters request custom content from you, it will appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {commissions.map((commission) => (
                        <div
                            key={commission.id}
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
                                        {commission.title}
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                                        {commission.description.length > 200 ? commission.description.substring(0, 200) + '...' : commission.description}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <StatusBadge status={commission.status} />
                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-900">
                                        <DollarSign size={14} className="text-emerald-500" />
                                        {commission.budget} USDC
                                    </span>
                                </div>
                            </div>

                            {/* Meta info */}
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                                {commission.requesterAddress && (
                                    <span className="flex items-center gap-1">
                                        <User size={12} />
                                        Requested by {shortenAddress(commission.requesterAddress)}
                                    </span>
                                )}
                                {commission.createdAt && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(commission.createdAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {/* Actions based on status */}
                            {commission.status === 'open' && (
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => handleAccept(commission)}
                                        disabled={acceptingId === commission.id}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {acceptingId === commission.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle size={16} />
                                        )}
                                        Accept & Start Working
                                    </button>
                                </div>
                            )}

                            {commission.status === 'claimed' && (
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        Deliverable (link or description)
                                    </label>
                                    <textarea
                                        value={deliverables[commission.id] || ''}
                                        onChange={(e) => setDeliverables(prev => ({ ...prev, [commission.id]: e.target.value }))}
                                        placeholder="Paste a link to the content or describe the deliverable..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-vertical mb-3"
                                    />
                                    <button
                                        onClick={() => handleSubmitDeliverable(commission)}
                                        disabled={submittingId === commission.id}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {submittingId === commission.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                        Submit Deliverable
                                    </button>
                                </div>
                            )}

                            {commission.status === 'submitted' && (
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                    {commission.submissionResult && (
                                        <div style={{ marginBottom: '12px', padding: '12px 16px', background: 'var(--color-bg-page)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>
                                                Your Submission
                                            </span>
                                            {commission.submissionResult}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium">
                                        <Clock size={16} />
                                        Waiting for supporter approval
                                    </div>
                                </div>
                            )}

                            {commission.status === 'completed' && (
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                    <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-purple-50 text-purple-700 text-sm font-medium">
                                        <CheckCircle size={16} />
                                        Completed - {commission.budget} USDC earned
                                    </div>
                                </div>
                            )}

                            {commission.status === 'rejected' && (
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                    <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium">
                                        <XCircle size={16} />
                                        Rejected by supporter
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
