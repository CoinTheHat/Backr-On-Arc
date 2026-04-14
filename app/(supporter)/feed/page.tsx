'use client';

import { useState, useEffect } from 'react';
import Button from '../../components/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export default function FeedPage() {
    const router = useRouter();
    const { isConnected } = useAccount();
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

    useEffect(() => {
        // Fetch posts
        setTimeout(() => {
            fetch('/api/posts')
                .then(res => res.json())
                .then(data => {
                    const enriched = data.map((p: any) => ({
                        ...p,
                        isPublic: p.isPublic ?? Math.random() > 0.6,
                        minTier: p.minTier || (Math.random() > 0.5 ? 2 : 0)
                    })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    setPosts(enriched);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }, 800);
    }, []);

    useEffect(() => {
        if (filter === 'all') setFilteredPosts(posts);
        else if (filter === 'unlocked') setFilteredPosts(posts.filter(p => p.isPublic));
        else setFilteredPosts(posts.filter(p => !p.isPublic));
    }, [filter, posts]);

    if (!isConnected) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <EmptyState
                    title="Your personal feed"
                    description="Sign in to see updates from your favorite creators."
                    actionLabel="Explore Creators"
                    onAction={() => router.push('/explore')}
                />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .post-card { transition: all 0.2s ease; }
                .post-card:hover { box-shadow: var(--shadow-xl) !important; transform: translateY(-2px); }
                
                .filter-pill {
                    padding: 6px 16px; border-radius: 99px; font-weight: 600; font-size: 0.85rem;
                    cursor: pointer; transition: all 0.2s; border: 1px solid var(--color-border);
                    background: #fff; color: var(--color-text-secondary);
                }
                .filter-pill.active { background: var(--color-text-primary); color: #fff; border-color: var(--color-text-primary); }
                .filter-pill:hover:not(.active) { border-color: var(--color-text-primary); color: var(--color-text-primary); }

                .interaction-btn {
                    background: transparent; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    color: var(--color-text-secondary); transition: all 0.2s; padding: 8px; border-radius: 8px;
                }
                .interaction-btn:hover { background: var(--color-bg-surface-hover); color: var(--color-text-primary); }
            `}} />

            {/* Compact Hero & Toolbar */}
            <div style={{ background: '#fff', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 'var(--header-height, 0px)', zIndex: 10 }}>
                <div className="page-container" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 className="headline-serif" style={{ fontSize: '1.75rem', margin: 0 }}>Your feed</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['all', 'unlocked', 'locked'] as const).map(f => (
                            <button
                                key={f}
                                className={`filter-pill ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="page-container" style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '32px', paddingBottom: '80px' }}>
                {loading ? (
                    <div className="grid-system" style={{ gridTemplateColumns: '1fr', gap: '24px' }}>
                        {[1, 2].map(i => (
                            <div key={i} className="card-surface" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                    <LoadingSkeleton variant="circle" width="48px" height="48px" />
                                    <div style={{ flex: 1 }}>
                                        <LoadingSkeleton variant="text" width="40%" height="20px" style={{ marginBottom: '8px' }} />
                                        <LoadingSkeleton variant="text" width="20%" height="14px" />
                                    </div>
                                </div>
                                <LoadingSkeleton variant="rect" height="200px" borderRadius="12px" />
                            </div>
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <>
                        <EmptyState
                            title={filter === 'all' ? "You're not supporting anyone yet" : `No ${filter} posts found`}
                            description={filter === 'all' ? "Support creators to see their exclusive content here." : "Try changing your filter settings."}
                            actionLabel="Discover Creators"
                            onAction={() => router.push('/explore')}
                        />

                        {/* Recommended Creators */}
                        <div style={{ marginTop: '48px' }}>
                            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Recommended for you</h3>
                            <div className="grid-system explore-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="card-surface hover-lift" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => router.push('/explore')}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eee', flexShrink: 0 }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700 }}>Creator Name</div>
                                            <div className="text-caption">Visual Artist</div>
                                        </div>
                                        <Button size="sm" variant="secondary">View</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    filteredPosts.map((post: any, i) => {
                        const locked = !post.isPublic;
                        return (
                            <div
                                key={i}
                                className="post-card card-surface"
                                style={{ marginBottom: '24px', padding: 0, overflow: 'hidden' }}
                            >
                                <div style={{ padding: '24px' }}>
                                    {/* Post Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div
                                            onClick={() => router.push(`/${post.creatorAddress}`)}
                                            style={{
                                                width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer',
                                                background: `linear-gradient(135deg, #${post.creatorAddress?.slice(2, 8) || 'ccc'} 0%, #eee 100%)`,
                                            }}
                                        />
                                        <div>
                                            <div
                                                onClick={() => router.push(`/${post.creatorAddress}`)}
                                                style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '1rem', cursor: 'pointer', lineHeight: 1.2 }}
                                            >
                                                Creator {post.creatorAddress?.slice(0, 6)}
                                            </div>
                                            <div className="text-caption">
                                                {new Date(post.createdAt).toLocaleDateString()} • {locked ? 'Members only' : 'Public'}
                                            </div>
                                        </div>
                                        {locked && <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>🔒 Tier {post.minTier}+</span>}
                                    </div>

                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', lineHeight: '1.4' }}>
                                        {post.title}
                                    </h3>

                                    {/* Content & Lock State */}
                                    <div style={{ position: 'relative', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
                                        {locked ? (
                                            <div style={{ position: 'relative', background: '#f9fafb', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <div style={{ filter: 'blur(12px)', opacity: 0.6, padding: '24px', userSelect: 'none', pointerEvents: 'none' }}>
                                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
                                                    <div style={{ height: '200px', background: '#ddd', marginTop: '16px', borderRadius: '8px' }}></div>
                                                </div>
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(255,255,255,0.4)', zIndex: 5
                                                }}>
                                                    <div style={{ background: 'rgba(0,0,0,0.8)', padding: '24px', borderRadius: '16px', textAlign: 'center', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxWidth: '90%' }}>
                                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
                                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Unlock this post</div>
                                                        <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '16px' }}>Join the <strong>Tier {post.minTier}</strong> membership to view.</div>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <Button size="sm" variant="primary" style={{ background: '#fff', color: '#000' }} onClick={() => router.push(`/${post.creatorAddress}`)}>Unlock Now</Button>
                                                            <Button size="sm" variant="ghost" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => router.push(`/${post.creatorAddress}`)}>View Tiers</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                                                {post.content}
                                                {post.image && (
                                                    <div style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                                        <img src={post.image} alt="" style={{ width: '100%', display: 'block' }} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Interaction Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="interaction-btn">❤️ <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>124</span></button>
                                            <button className="interaction-btn">💬 <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>24 comments</span></button>
                                        </div>
                                        <button className="interaction-btn">↗ Share</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
