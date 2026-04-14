'use client';

import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import WalletButton from '../../components/WalletButton';
import { Crown } from 'lucide-react';

export default function MyMembershipsPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [memberships, setMemberships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [recommended, setRecommended] = useState<any[]>([]);

    useEffect(() => {
        if (!isConnected) return;
        if (!address) {
            setLoading(false);
            return;
        }
        setLoading(true);

        // Parallel fetch
        Promise.all([
            fetch(`/api/subscriptions?subscriber=${address.toLowerCase()}`).then(res => res.json()),
            fetch('/api/creators').then(res => res.json())
        ]).then(([subs, creators]) => {
            if (Array.isArray(subs)) setMemberships(subs);
            if (Array.isArray(creators)) setRecommended(creators.slice(0, 3)); // Simple "top 3" for now
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [address, isConnected]);

    const categories = ['Art', 'Music', 'Podcast', 'Writing', 'Gaming', 'Education'];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .membership-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 12px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .badge-success {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10B981;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                .discovery-chip {
                    padding: 8px 16px;
                    border-radius: 999px;
                    background: var(--color-bg-surface);
                    border: 1px solid var(--color-border);
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .discovery-chip:hover {
                    background: var(--color-brand-blue);
                    color: white;
                    border-color: var(--color-brand-blue);
                    transform: translateY(-1px);
                }
            `}} />

            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: 'white',
                padding: '64px 0 120px',
                marginBottom: '-60px',
                textAlign: 'center'
            }}>
                <div className="page-container">
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        My Memberships
                    </h1>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
                        Manage your active subscriptions and discover new creators to back.
                    </p>
                </div>
            </div>

            <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '80px' }}>
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl p-5 mb-6 flex items-start gap-3">
                    <Crown size={22} className="shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-base mb-1">Your Creator Memberships</h3>
                        <p className="text-sm leading-relaxed">Track all your active subscriptions to creators on Backr. Each membership was purchased with USDC on Arc Network. Click any creator to visit their profile and access member-only content.</p>
                    </div>
                </div>
                {!isConnected ? (
                    <div style={{ padding: '64px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
                        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Sign in</h3>
                        <p className="text-body" style={{ marginBottom: '24px' }}>Sign in to view and manage your active memberships.</p>
                        <WalletButton size="lg" />
                    </div>
                ) : loading ? (
                    <div className="membership-grid">
                        {[1, 2].map(i => (
                            <div key={i} className="card-surface" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                                    <LoadingSkeleton variant="circle" width="64px" height="64px" />
                                    <div style={{ flex: 1 }}>
                                        <LoadingSkeleton variant="text" width="60%" height="24px" style={{ marginBottom: '8px' }} />
                                        <LoadingSkeleton variant="text" width="40%" height="16px" />
                                    </div>
                                </div>
                                <LoadingSkeleton variant="rect" height="40px" width="100%" borderRadius="8px" />
                            </div>
                        ))}
                    </div>
                ) : memberships.length === 0 ? (
                    <>
                        <EmptyState
                            title="No active memberships"
                            description="You are not supporting any creators yet. Join a membership to unlock exclusive content."
                            actionLabel="Explore Creators"
                            onAction={() => router.push('/explore')}
                        />

                        <div style={{ marginTop: '64px' }}>
                            <h2 className="text-h3" style={{ marginBottom: '24px' }}>Discover something new</h2>

                            {/* Categories */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
                                {categories.map(cat => (
                                    <button key={cat} className="discovery-chip" onClick={() => router.push(`/explore?cat=${cat}`)}>
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                {/* Recommended */}
                                <div className="card-surface" style={{ padding: '24px' }}>
                                    <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Recommended for you</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {recommended.map((creator, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                                                    {creator.avatarUrl ? <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" /> : null}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => router.push('/' + creator.address)}>
                                                        {creator.name}
                                                    </div>
                                                    <div className="text-caption">{creator.backrCount || 0} Backrs</div>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => router.push('/' + creator.address)}>View</Button>
                                            </div>
                                        ))}
                                        {recommended.length === 0 && <div className="text-caption">No new creators found.</div>}
                                    </div>
                                </div>

                                {/* Trending - Keeping static for now or can reuse recommended sorted by backrs */}
                                <div className="card-surface" style={{ padding: '24px' }}>
                                    <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Trending now</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {recommended.slice().reverse().map((creator, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', overflow: 'hidden' }}>
                                                    {creator.avatarUrl ? <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" /> : null}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{creator.name}</div>
                                                    <div className="text-caption">Trending in Global</div>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => router.push('/' + creator.address)}>View</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="membership-grid" style={{ marginBottom: '64px' }}>
                            {memberships.map((sub, i) => {
                                const isExpired = new Date(sub.expiresAt) < new Date();
                                return (
                                    <div
                                        key={i}
                                        className="card-surface hover-lift"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: '24px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: isExpired ? '1px solid var(--color-warning)' : undefined
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
                                            <div
                                                onClick={() => router.push(`/${sub.creatorAddress}`)}
                                                style={{
                                                    width: '72px', height: '72px', borderRadius: '50%',
                                                    background: sub.creators?.avatarUrl ? `url(${sub.creators.avatarUrl}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontWeight: 'bold', fontSize: '1.75rem', flexShrink: 0, cursor: 'pointer',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {!sub.creators?.avatarUrl && (sub.creators?.name?.charAt(0).toUpperCase() || sub.creatorAddress.charAt(2).toUpperCase())}
                                            </div>
                                            <div>
                                                <h3
                                                    onClick={() => router.push(`/${sub.creatorAddress}`)}
                                                    style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px', color: 'var(--color-text-primary)', cursor: 'pointer' }}
                                                >
                                                    {sub.creators?.name || `Creator ${sub.creatorAddress.slice(0, 6)}...`}
                                                </h3>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                                                    Member • <span style={{ fontWeight: 600 }}>Active</span>
                                                </div>
                                                {isExpired ? (
                                                    <span className="badge" style={{ background: '#FECACA', color: '#991B1B' }}>Expired</span>
                                                ) : (
                                                    <span className="badge badge-success">Active</span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                            <div className="text-caption">
                                                {isExpired ? 'Expired on:' : 'Renews:'} <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{new Date(sub.expiresAt).toLocaleDateString()}</span>
                                            </div>
                                            <Button
                                                variant={isExpired ? 'primary' : 'outline'}
                                                size="sm"
                                                onClick={() => router.push(`/${sub.creatorAddress}`)} // Redirect to creator page to re-subscribe
                                            >
                                                {isExpired ? 'Renew Membership' : 'Manage'}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* History Table */}
                        <div style={{ marginTop: '40px' }}>
                            <h3 className="text-h3" style={{ marginBottom: '24px' }}>Payment History</h3>
                            <div className="card-surface" style={{ overflow: 'hidden', padding: 0 }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                        <thead style={{ background: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)' }}>
                                            <tr>
                                                <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>DATE</th>
                                                <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>DETAILS</th>
                                                <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>AMOUNT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {memberships.map((m, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>{new Date().toLocaleDateString()}</td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ fontWeight: 600 }}>Membership Renewal</div>
                                                        <div className="text-caption">{m.creators?.name || 'Creator'}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600 }}>5.00 USD</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
