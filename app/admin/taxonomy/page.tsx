'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/Card';


interface Category {
    id: string; // slug
    name: string;
    icon: string;
    sortOrder: number;
    isActive: boolean;
}

interface Hashtag {
    id: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
    isTrending: boolean;
    trendingScore: number;
}

export default function AdminTaxonomyPage() {
    const [activeTab, setActiveTab] = useState<'categories' | 'hashtags'>('categories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [hashtags, setHashtags] = useState<Hashtag[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catsRes, tagsRes] = await Promise.all([
                fetch('/api/taxonomy/categories').then(r => r.json()),
                fetch('/api/taxonomy/hashtags').then(r => r.json())
            ]);
            setCategories(Array.isArray(catsRes) ? catsRes : []);
            setHashtags(Array.isArray(tagsRes) ? tagsRes : []);
        } catch (e) {
            console.error(e);
            alert('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        const endpoint = activeTab === 'categories' ? '/api/taxonomy/categories' : '/api/taxonomy/hashtags';
        const method = editingId === 'new' ? 'POST' : 'PATCH';

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save');

            await fetchData();
            setEditingId(null);
            setFormData({});
        } catch (e) {
            alert('Error saving item');
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This cannot be undone.')) return;

        const endpoint = activeTab === 'categories' ? `/api/taxonomy/categories?id=${id}` : `/api/taxonomy/hashtags?id=${id}`;

        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            await fetchData();
        } catch (e) {
            alert('Error deleting item');
        }
    };

    const startEdit = (item: any) => {
        setEditingId(item.id);
        setFormData(item);
    };

    const startNew = () => {
        setEditingId('new');
        setFormData(activeTab === 'categories' ? { name: '', icon: '📌', sortOrder: 0, isActive: true } : { label: '', sortOrder: 0, isActive: true, isTrending: false });
    };

    return (
        <div className="page-container" style={{ padding: '40px 0' }}>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-h2">Global Taxonomy</h1>
                <button onClick={startNew} className="btn-primary flex items-center gap-2">
                    <span>+</span> Add {activeTab === 'categories' ? 'Category' : 'Hashtag'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-4 px-4 font-semibold ${activeTab === 'categories' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                >
                    Categories
                </button>
                <button
                    onClick={() => setActiveTab('hashtags')}
                    className={`pb-4 px-4 font-semibold ${activeTab === 'hashtags' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                >
                    Hashtags
                </button>
            </div>

            {/* Content */}
            <div className="grid gap-6">
                {loading ? (
                    <div>Loading...</div>
                ) : activeTab === 'categories' ? (
                    // Categories List
                    <div className="grid gap-4">
                        {categories.map(cat => (
                            <Card key={cat.id} variant="surface" padding="md" className="flex items-center justify-between group">
                                {editingId === cat.id ? (
                                    <div className="flex gap-4 items-center w-full">
                                        <input className="input w-16 text-center" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="Icon" />
                                        <input className="input flex-1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Name" />
                                        <input className="input w-24" type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} placeholder="Order" />
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /> Active
                                        </label>
                                        <button onClick={handleSave} className="btn-primary text-xs py-2 px-4">Save</button>
                                        <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-2 px-4">Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl w-12 text-center bg-gray-50 rounded-lg py-2">{cat.icon}</span>
                                            <div>
                                                <div className="font-bold text-lg">{cat.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">slug: {cat.id} • order: {cat.sortOrder}</div>
                                            </div>
                                            {!cat.isActive && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">Disabled</span>}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(cat)} className="btn-secondary text-xs py-2 px-4">Edit</button>
                                            <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">🗑️</button>
                                        </div>
                                    </>
                                )}
                            </Card>
                        ))}

                        {/* New Category Form */}
                        {editingId === 'new' && activeTab === 'categories' && (
                            <Card variant="surface" padding="md" className="flex items-center justify-between border-2 border-blue-500 bg-blue-50/10">
                                <div className="flex gap-4 items-center w-full">
                                    <input className="input w-16 text-center" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="Icon" autoFocus />
                                    <input className="input flex-1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Name" />
                                    <input className="input w-24" type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} placeholder="Order" />
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /> Active
                                    </label>
                                    <button onClick={handleSave} className="btn-primary text-xs py-2 px-4">Create</button>
                                    <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-2 px-4">Cancel</button>
                                </div>
                            </Card>
                        )}
                    </div>
                ) : (
                    // Hashtags List
                    <div className="grid gap-4">
                        {hashtags.map(tag => (
                            <Card key={tag.id} variant="surface" padding="md" className="flex items-center justify-between group">
                                {editingId === tag.id ? (
                                    <div className="flex gap-4 items-center w-full">
                                        <span className="font-bold text-gray-400">#</span>
                                        <input className="input flex-1" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} placeholder="Label" />
                                        <input className="input w-24" type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} placeholder="Order" />
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /> Active
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={formData.isTrending} onChange={e => setFormData({ ...formData, isTrending: e.target.checked })} /> Trending
                                        </label>
                                        <button onClick={handleSave} className="btn-primary text-xs py-2 px-4">Save</button>
                                        <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-2 px-4">Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="font-bold text-lg">#{tag.label}</div>
                                            <div className="text-xs text-gray-500 font-mono">id: {tag.id} • order: {tag.sortOrder}</div>
                                            {tag.isTrending && <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded font-bold">🔥 Trending</span>}
                                            {!tag.isActive && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">Disabled</span>}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(tag)} className="btn-secondary text-xs py-2 px-4">Edit</button>
                                            <button onClick={() => handleDelete(tag.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">🗑️</button>
                                        </div>
                                    </>
                                )}
                            </Card>
                        ))}

                        {/* New Hashtag Form */}
                        {editingId === 'new' && activeTab === 'hashtags' && (
                            <Card variant="surface" padding="md" className="flex items-center justify-between border-2 border-blue-500 bg-blue-50/10">
                                <div className="flex gap-4 items-center w-full">
                                    <span className="font-bold text-gray-400">#</span>
                                    <input className="input flex-1" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} placeholder="Label" autoFocus />
                                    <input className="input w-24" type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} placeholder="Order" />
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /> Active
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={formData.isTrending} onChange={e => setFormData({ ...formData, isTrending: e.target.checked })} /> Trending
                                    </label>
                                    <button onClick={handleSave} className="btn-primary text-xs py-2 px-4">Create</button>
                                    <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-2 px-4">Cancel</button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
        .input {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-size: 0.9rem;
        }
        .input:focus {
          outline: none;
          border-color: #000;
          ring: 2px solid rgba(0,0,0,0.1);
        }
      `}</style>
        </div>
    );
}
