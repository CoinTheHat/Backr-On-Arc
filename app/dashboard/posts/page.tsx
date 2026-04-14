'use client';

import { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';
import ImageUpload from '../../components/ImageUpload';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export default function PostsPage() {
    const { address } = useAccount();
    const router = useRouter();

    // VIEW STATE: 'list' | 'editor'
    const [view, setView] = useState<'list' | 'editor'>('list');

    // EDITOR STATE
    const [title, setTitle] = useState('');
    const [teaser, setTeaser] = useState('');
    const [content, setContent] = useState('');
    const [postImage, setPostImage] = useState('');
    const [visibility, setVisibility] = useState<'members' | 'public' | 'ppv'>('members');
    const [minTier, setMinTier] = useState<number>(0);
    const [ppvPrice, setPpvPrice] = useState<string>('0.005');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [blocks] = useState(['Basics', 'Access', 'Content', 'Review']);
    const [activeBlock, setActiveBlock] = useState(0);

    // APP STATE
    const [saving, setSaving] = useState(false);
    const [creatorTiers, setCreatorTiers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);

    // LIST FILTERS
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, published, draft
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Load Data
    useEffect(() => {
        if (!address) return;
        fetchTiers();
        fetchPosts();
    }, [address]);

    const fetchTiers = () => {
        fetch(`/api/tiers?address=${address}`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setCreatorTiers(data); });
    };

    const fetchPosts = async () => {
        if (!address) return;
        const res = await fetch(`/api/posts?creator=${address}`);
        const data = await res.json();
        if (Array.isArray(data)) setPosts(data);
    };

    const handleSave = async (newStatus: 'draft' | 'published') => {
        if (!title || !address) { alert('Post title is required'); return; }
        if (newStatus === 'published' && !content) { alert('Cannot publish empty content'); return; }

        setSaving(true);
        const method = editingPostId ? 'PUT' : 'POST';
        const body: any = {
            creatorAddress: address,
            title, content, teaser, image: postImage,
            isPublic: visibility === 'public',
            minTier: visibility === 'public' ? 0 : (visibility === 'ppv' ? 1 : minTier),
            ppvEnabled: visibility === 'ppv',
            ppvPrice: visibility === 'ppv' ? ppvPrice : null,
            status: newStatus,
            createdAt: new Date().toISOString()
        };
        if (editingPostId) body.id = editingPostId;

        try {
            await fetch('/api/posts', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            await fetchPosts();
            if (newStatus === 'published') {
                resetForm();
                setView('list'); // Go back to list on publish
            } else {
                // Remain in editor if draft
            }
        } catch (e) { console.error(e); alert('Failed to save post'); }
        finally { setSaving(false); }
    };

    const resetForm = () => {
        setTitle(''); setContent(''); setTeaser(''); setPostImage('');
        setEditingPostId(null); setStatus('draft'); setVisibility('members'); setMinTier(0);
        setPpvPrice('0.005'); setActiveBlock(0);
    };

    const openEditor = (post?: any) => {
        if (post) {
            setEditingPostId(post.id);
            setTitle(post.title);
            setContent(post.content);
            setTeaser(post.teaser || '');
            setPostImage(post.image || '');
            const initialVis = post.ppvEnabled ? 'ppv' : (post.isPublic ? 'public' : 'members');
            setVisibility(initialVis);
            setMinTier(post.minTier || 0);
            setPpvPrice(post.ppvPrice ? String(post.ppvPrice) : '0.005');
            setStatus(post.status || 'draft');
        } else {
            resetForm();
        }
        setView('editor');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (postId: number) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        setPosts(posts.filter(p => p.id !== postId));
        // Real app: DELETE API call
    };

    // Derived Logic
    const wordCount = content.trim().split(/\s+/).length;

    // Filter & Pagination Logic
    const filteredPosts = posts.filter(post => {
        if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterStatus !== 'all' && post.status !== filterStatus) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
    const paginatedPosts = filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const activeTierName = creatorTiers.find((t, i) => i + 1 === minTier)?.name || 'All Members';

    /* ==========================================================================================
       VIEW: EDITOR (Stepper)
       ========================================================================================== */
    if (view === 'editor') {
        return (
            <div className="page-container" style={{ paddingBottom: '120px' }}>
                <SectionHeader
                    title={editingPostId ? "Edit Post" : "New Post"}
                    description="Create, manage, and publish your content."
                    action={{ label: 'Close', onClick: () => setView('list'), variant: 'ghost' }}
                />

                {/* STEPPER NAV */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '32px', gap: '40px' }}>
                    {blocks.map((block, i) => (
                        <div key={i} onClick={() => setActiveBlock(i)}
                            style={{
                                padding: '16px 0', borderBottom: activeBlock === i ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeBlock === i ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                            }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: activeBlock === i ? 'var(--color-primary)' : 'var(--color-border)', color: activeBlock === i ? '#fff' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{i + 1}</span>
                            {block}
                        </div>
                    ))}
                </div>

                <div className="editor-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 3fr)', gap: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {activeBlock === 0 && ( /* BASICS */
                            <Card padding="lg">
                                <h3 className="text-h3" style={{ marginBottom: '24px' }}>Post Basics</h3>
                                <Input label="Title" placeholder="Post Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ fontSize: '1.2rem', padding: '16px' }} />
                                <div style={{ marginTop: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Visibility</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                        <div onClick={() => setVisibility('public')} className={`selection-card ${visibility === 'public' ? 'selected' : ''}`} style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: visibility === 'public' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', cursor: 'pointer', background: visibility === 'public' ? 'var(--color-primary-light)' : 'var(--color-bg-page)' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>🌍 Public</div><div className="text-caption" style={{ fontSize: '0.75rem' }}>Free for everyone</div>
                                        </div>
                                        <div onClick={() => setVisibility('members')} className={`selection-card ${visibility === 'members' ? 'selected' : ''}`} style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: visibility === 'members' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', cursor: 'pointer', background: visibility === 'members' ? 'var(--color-primary-light)' : 'var(--color-bg-page)' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔒 Members</div><div className="text-caption" style={{ fontSize: '0.75rem' }}>For subscribers</div>
                                        </div>
                                        <div onClick={() => setVisibility('ppv')} className={`selection-card ${visibility === 'ppv' ? 'selected' : ''}`} style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: visibility === 'ppv' ? '2px solid #8b5cf6' : '1px solid var(--color-border)', cursor: 'pointer', background: visibility === 'ppv' ? 'rgba(139, 92, 246, 0.08)' : 'var(--color-bg-page)' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>⚡ Pay-Per-View</div><div className="text-caption" style={{ fontSize: '0.75rem' }}>USDC nanopayment</div>
                                        </div>
                                    </div>
                                    {visibility === 'ppv' && (
                                        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-md)' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Price per view (USDC)</label>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div style={{ position: 'relative', flex: 1 }}>
                                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>$</span>
                                                    <input type="number" step="0.001" min="0.001" max="0.01" value={ppvPrice} onChange={(e) => setPpvPrice(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 28px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '1rem', fontWeight: 600 }} />
                                                </div>
                                                {['0.001', '0.005', '0.01'].map(v => (
                                                    <button key={v} onClick={() => setPpvPrice(v)} style={{ padding: '10px 14px', border: ppvPrice === v ? '2px solid #8b5cf6' : '1px solid var(--color-border)', background: ppvPrice === v ? 'rgba(139, 92, 246, 0.1)' : '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>${v}</button>
                                                ))}
                                            </div>
                                            <div className="text-caption" style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                Supporters unlock this post with a gasless micro-payment via Circle Nanopayments. 95% to you, 5% platform fee.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                        {activeBlock === 1 && ( /* ACCESS */
                            <Card padding="lg">
                                <h3 className="text-h3" style={{ marginBottom: '24px' }}>Access Control</h3>
                                {visibility === 'public' && (
                                    <div style={{ padding: '24px', background: 'var(--color-bg-page)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                        <p>Post is <strong>Public</strong> and free for everyone.</p>
                                    </div>
                                )}
                                {visibility === 'ppv' && (
                                    <div style={{ padding: '24px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>⚡</span>
                                            <strong>Pay-Per-View Post</strong>
                                        </div>
                                        <p style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                            Supporters pay <strong>${ppvPrice} USDC</strong> to unlock this specific post.
                                        </p>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                                            <li>• Gasless micro-payments via Circle Gateway</li>
                                            <li>• Creator receives 95%, platform fee 5%</li>
                                            <li>• Supporter pays once, gains permanent access</li>
                                        </ul>
                                    </div>
                                )}
                                {visibility === 'members' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div onClick={() => setMinTier(0)} style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: minTier === 0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input type="radio" checked={minTier === 0} readOnly /><div><div style={{ fontWeight: 600 }}>All Members</div></div>
                                        </div>
                                        {creatorTiers.map((t, i) => (
                                            <div key={i} onClick={() => setMinTier(i + 1)} style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: minTier === i + 1 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <input type="radio" checked={minTier === i + 1} readOnly /><div><div style={{ fontWeight: 600 }}>{t.name} +</div><div className="text-caption">{t.price} USD</div></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        )}
                        {activeBlock === 2 && ( /* CONTENT */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <Card padding="lg">
                                    <h3 className="text-h3" style={{ marginBottom: '16px' }}>Media</h3>
                                    <ImageUpload
                                        bucket="posts"
                                        value={postImage}
                                        onChange={setPostImage}
                                        aspectRatio="video"
                                        helperText="Recommended: 16:9 aspect ratio. Max 5MB."
                                    />
                                    <div style={{ marginTop: '16px' }}><label className="text-caption" style={{ fontWeight: 600 }}>TEASER</label><textarea placeholder="Public hook..." value={teaser} onChange={(e) => setTeaser(e.target.value)} style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', minHeight: '80px' }} /></div>
                                </Card>
                                <Card padding="none" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-page)', display: 'flex', gap: '8px' }}>{['B', 'I', 'U', '🔗'].map(t => <button key={t} style={{ width: '28px', height: '28px', border: '1px solid var(--color-border)', background: '#fff', borderRadius: '4px' }}>{t}</button>)}<div style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>{wordCount} words</div></div>
                                    <textarea placeholder="Write content..." value={content} onChange={(e) => setContent(e.target.value)} style={{ width: '100%', padding: '24px', border: 'none', minHeight: '400px', fontSize: '1.1rem', resize: 'vertical', outline: 'none' }} />
                                </Card>
                            </div>
                        )}
                        {activeBlock === 3 && ( /* REVIEW */
                            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div><h2 className="text-h2">Ready?</h2>
                                <Button variant="primary" size="lg" onClick={() => handleSave('published')}>Publish Now</Button>
                            </div>
                        )}
                    </div>
                    {/* PREVIEW */}
                    <div className="preview-column"><div style={{ position: 'sticky', top: '100px' }}><div className="text-caption" style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>Live Preview</div><div className="card-surface" style={{ padding: 0, overflow: 'hidden', opacity: title ? 1 : 0.6 }}>{postImage && <img src={postImage} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />}<div style={{ padding: '20px' }}><h3 className="text-h3">{title || 'Untitled'}</h3><p className="text-body" style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>{teaser || content.substring(0, 100) || '...'}</p></div></div></div></div>
                </div>

                {/* STICKY BAR */}
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', borderTop: '1px solid var(--color-border)', padding: '16px 24px', zIndex: 100, display: 'flex', justifyContent: 'space-between', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}><Button variant="ghost" onClick={() => setView('list')}>Cancel</Button></div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {activeBlock > 0 && <Button variant="outline" onClick={() => setActiveBlock(p => p - 1)}>Back</Button>}
                        {activeBlock < 3 ? <Button variant="primary" onClick={() => setActiveBlock(p => p + 1)}>Next</Button> : <Button variant="primary" onClick={() => handleSave('published')}>Publish</Button>}
                        <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saving}>Save Draft</Button>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `.editor-layout { grid-template-columns: 1fr !important; } @media(min-width: 1000px){ .editor-layout { grid-template-columns: 5fr 3fr !important; } } .preview-column { display: none; } @media(min-width: 1000px) { .preview-column { display: block; } } .selection-card.selected { border-color: var(--color-primary) !important; background: var(--color-primary-light) !important; } .hover-border-primary:hover { border-color: var(--color-primary) !important; }` }} />
            </div>
        );
    }

    /* ==========================================================================================
       VIEW: LIST (Content Library)
       ========================================================================================== */
    return (
        <div className="page-container" style={{ paddingBottom: '100px' }}>
            <SectionHeader
                title="Content Library"
                description="Manage all your posts, drafts, and published content."
            />

            {/* HEADER CONTROLS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div className="posts-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @media (max-width: 640px) { .posts-toolbar { flex-direction: column; align-items: stretch; } .search-box { width: 100% !important; max-width: none !important; } }
                        @media (max-width: 1024px) { .create-post-btn-desktop { display: none !important; } }
                     `}} />

                    {/* Left: Filter & Search */}
                    <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '300px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="search-box" style={{ position: 'relative', flex: 1, maxWidth: '320px', minWidth: '200px' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, zIndex: 1 }}>🔍</span>
                            <Input
                                placeholder="Search library..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                style={{ paddingLeft: '36px', height: '40px', background: '#fff' }}
                                containerStyle={{ marginBottom: 0 }}
                            />
                        </div>

                        {/* Segmented Control */}
                        <div style={{ display: 'flex', background: 'var(--color-bg-page)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            {['all', 'published', 'draft'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
                                    style={{
                                        padding: '6px 16px', borderRadius: '6px', border: 'none',
                                        background: filterStatus === s ? '#fff' : 'transparent',
                                        color: filterStatus === s ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                                        boxShadow: filterStatus === s ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize',
                                        transition: 'all 0.1s'
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Action (Desktop Only) */}
                    <div className="create-post-btn-desktop">
                        <Button variant="primary" onClick={() => openEditor()} leftIcon={<span>+</span>}>New Post</Button>
                    </div>
                </div>
            </div>

            {/* TABLE LIST VIEW (Desktop) */}
            <Card padding="none" style={{ overflow: 'visible', background: '#fff', border: '1px solid var(--color-border)' }} className="desktop-view">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ background: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Title</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Visibility</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Date</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Status</th>
                                <th style={{ padding: '16px 24px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '64px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📝</div>
                                        <div>No posts found.</div>
                                        {posts.length === 0 && <Button variant="outline" size="sm" style={{ marginTop: '16px' }} onClick={() => openEditor()}>Create your first post</Button>}
                                    </td>
                                </tr>
                            ) : (
                                paginatedPosts.map((post) => (
                                    <tr key={post.id} className="table-row" style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: post.image ? `url(${post.image}) center/cover` : 'var(--color-bg-page)', border: '1px solid var(--color-border)', flexShrink: 0 }}></div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{post.title}</div>
                                                    <div className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>{post.teaser ? post.teaser.substring(0, 40) + '...' : 'No teaser preview'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {post.ppvEnabled ? (
                                                <span className="badge" style={{ display: 'inline-flex', gap: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.75rem' }}>
                                                    ⚡ PPV ${post.ppvPrice}
                                                </span>
                                            ) : post.isPublic ? (
                                                <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534' }}>🌍 Public</span>
                                            ) : (
                                                <span className="badge badge-neutral" style={{ display: 'inline-flex', gap: '6px' }}>
                                                    🔒 Member <span style={{ opacity: 0.7 }}>T {post.minTier}+</span>
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            {new Date(post.createdAt || 0).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                                background: post.status === 'published' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-bg-page)',
                                                color: post.status === 'published' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                                border: post.status === 'published' ? 'none' : '1px solid var(--color-border)'
                                            }}>
                                                {(post.status || 'draft').toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <Button variant="ghost" size="sm" onClick={() => openEditor(post)}>Edit</Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} style={{ color: 'var(--color-error)' }}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* MOBILE CARD LIST VIEW */}
            <div className="mobile-view" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {paginatedPosts.length === 0 ? (
                    <div className="card-surface" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📝</div>
                        <div>No posts found.</div>
                        {posts.length === 0 && <Button variant="outline" size="sm" style={{ marginTop: '16px' }} onClick={() => openEditor()}>Create your first post</Button>}
                    </div>
                ) : (
                    paginatedPosts.map(post => (
                        <div key={post.id} className="card-surface" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: post.image ? `url(${post.image}) center/cover` : 'var(--color-bg-page)', border: '1px solid var(--color-border)', flexShrink: 0 }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{post.title}</div>
                                        <span style={{
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                                            background: post.status === 'published' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-bg-page)',
                                            color: post.status === 'published' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                        }}>
                                            {(post.status || 'draft').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-caption" style={{ marginBottom: '8px' }}>
                                        {new Date(post.createdAt || 0).toLocaleDateString()} • {post.ppvEnabled ? `PPV $${post.ppvPrice}` : post.isPublic ? 'Public' : `Tier ${post.minTier}+`}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                <Button variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEditor(post)}>Edit</Button>
                                <Button variant="ghost" style={{ flex: 1, justifyContent: 'center', color: 'var(--color-error)' }} onClick={() => handleDelete(post.id)}>Delete</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* PAGINATION */}
            {filteredPosts.length > 0 && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="text-caption">Showing {paginatedPosts.length} of {filteredPosts.length} posts</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                    </div>
                </div>
            )}


            <style dangerouslySetInnerHTML={{
                __html: `
                .table-row:hover { background-color: var(--color-bg-surface-hover) !important; }
                
                .desktop-view { display: block; }
                .mobile-view { display: none; }
                
                @media (max-width: 768px) {
                    .desktop-view { display: none !important; }
                    .mobile-view { display: flex !important; }
                }
            `}} />
        </div >
    );
}
