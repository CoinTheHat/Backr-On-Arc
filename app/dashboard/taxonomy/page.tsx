'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import Card from '@/app/components/Card';
import Button from '@/app/components/Button';

// Types
interface Category {
    id: string; // slug
    name: string;
    icon?: string;
    sortOrder: number;
    isActive: boolean;
}

interface Hashtag {
    id: string; // slug
    label: string; // display with #
    sortOrder: number;
    isActive: boolean;
    isTrending: boolean;
    trendingScore: number;
}

export default function TaxonomyPage() {
    const [activeTab, setActiveTab] = useState<'categories' | 'hashtags'>('categories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [hashtags, setHashtags] = useState<Hashtag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null); // Category or Hashtag
    const [bulkMode, setBulkMode] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'categories') {
            const res = await fetch('/api/taxonomy/categories');
            if (res.ok) setCategories(await res.json());
        } else {
            const res = await fetch('/api/taxonomy/hashtags');
            if (res.ok) setHashtags(await res.json());
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, type: 'categories' | 'hashtags') => {
        // In a real app, confirm first
        if (!confirm('Are you sure?')) return;

        const res = await fetch(`/api/taxonomy/${type}?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
    };

    const handleToggleActive = async (item: any, type: 'categories' | 'hashtags') => {
        const res = await fetch(`/api/taxonomy/${type}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, isActive: !item.isActive })
        });
        if (res.ok) fetchData();
    }

    const handleToggleTrending = async (item: Hashtag) => {
        const res = await fetch('/api/taxonomy/hashtags', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, isTrending: !item.isTrending })
        });
        if (res.ok) fetchData();
    }

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-dark mb-2">Discovery & Taxonomy</h1>
                    <p className="text-brand-muted">Manage categories and hashtags for the Explore page.</p>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'hashtags' && (
                        <button
                            onClick={() => { setEditingItem({}); setBulkMode(true); setIsModalOpen(true); }}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-brand-dark hover:border-brand-primary font-medium transition-colors shadow-sm">
                            Bulk Add
                        </button>
                    )}
                    <button
                        onClick={() => { setEditingItem({}); setBulkMode(false); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-brand-dark text-white rounded-xl hover:bg-black font-medium shadow-lg hover:shadow-xl transition-all">
                        + New {activeTab === 'categories' ? 'Category' : 'Hashtag'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === 'categories' ? 'text-brand-primary' : 'text-gray-400 hover:text-brand-dark'}`}>
                    Categories
                    {activeTab === 'categories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('hashtags')}
                    className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === 'hashtags' ? 'text-brand-primary' : 'text-gray-400 hover:text-brand-dark'}`}>
                    Hashtags
                    {activeTab === 'hashtags' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse"></div>)}
                </div>
            ) : activeTab === 'categories' ? (
                <div className="bg-white rounded-studio border border-gray-100 overflow-hidden shadow-studio">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-brand-muted font-bold tracking-wider">
                                <th className="p-4">Sort</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4 text-center">Active</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} className="border-b border-gray-50 last:border-0 hover:bg-brand-light/30 transition-colors">
                                    <td className="p-4 text-gray-400 font-mono text-sm">#{cat.sortOrder}</td>
                                    <td className="p-4 font-bold text-brand-dark flex items-center gap-3">
                                        <span className="text-xl bg-gray-50 p-2 rounded-lg">{cat.icon || '📁'}</span>
                                        {cat.name}
                                    </td>
                                    <td className="p-4 text-brand-muted font-mono text-xs">{cat.id}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleToggleActive(cat, 'categories')} className={`w-10 h-6 rounded-full p-1 transition-colors ${cat.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                            <div className={`active-dot w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${cat.isActive ? 'translate-x-4' : ''}`}></div>
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => { setEditingItem(cat); setBulkMode(false); setIsModalOpen(true); }} className="text-gray-400 hover:text-brand-primary mr-3 font-medium transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(cat.id, 'categories')} className="text-gray-400 hover:text-red-500 font-medium transition-colors">Del</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {categories.length === 0 && <div className="p-12 text-center text-brand-muted">No categories found.</div>}
                </div>
            ) : (
                <div className="bg-white rounded-studio border border-gray-100 overflow-hidden shadow-studio">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-brand-muted font-semibold">
                                <th className="p-4">Sort</th>
                                <th className="p-4">Label</th>
                                <th className="p-4 text-center">Trending</th>
                                <th className="p-4 text-center">Active</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hashtags.map((tag) => (
                                <tr key={tag.id} className="border-b border-gray-50 last:border-0 hover:bg-brand-light/30 transition-colors">
                                    <td className="p-4 text-gray-400 font-mono text-sm">#{tag.sortOrder}</td>
                                    <td className="p-4 font-bold text-brand-secondary">#{tag.label}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleToggleTrending(tag)} className={`text-xl transition-all ${tag.isTrending ? 'grayscale-0 opacity-100 scale-110' : 'grayscale opacity-30 hover:opacity-100 hover:scale-110'}`}>🔥</button>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleToggleActive(tag, 'hashtags')} className={`w-10 h-6 rounded-full p-1 transition-colors ${tag.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                            <div className={`active-dot w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${tag.isActive ? 'translate-x-4' : ''}`}></div>
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => { setEditingItem(tag); setBulkMode(false); setIsModalOpen(true); }} className="text-gray-400 hover:text-brand-primary mr-3 font-medium transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(tag.id, 'hashtags')} className="text-gray-400 hover:text-red-500 font-medium transition-colors">Del</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {hashtags.length === 0 && <div className="p-12 text-center text-brand-muted">No hashtags found.</div>}
                </div>
            )}

            {/* Modal - Basic Implementation */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-studio w-full max-w-md p-8 transform transition-all scale-100">
                        <h2 className="text-2xl font-bold mb-6 text-brand-dark">
                            {editingItem?.id ? 'Edit' : 'New'} {activeTab === 'categories' ? 'Category' : 'Hashtag'}
                        </h2>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const body: any = Object.fromEntries(formData);

                            // Handle checkboxes
                            body.isActive = formData.get('isActive') === 'on';
                            if (activeTab === 'hashtags') body.isTrending = formData.get('isTrending') === 'on';

                            // Handle Bulk
                            if (bulkMode && activeTab === 'hashtags') {
                                const tags = (formData.get('bulkTags') as string).split(',').map(t => ({ label: t.trim() }));
                                await fetch('/api/taxonomy/hashtags', { method: 'POST', body: JSON.stringify(tags) });
                            } else {
                                await fetch(`/api/taxonomy/${activeTab}`, { method: 'POST', body: JSON.stringify(body) });
                            }

                            setIsModalOpen(false);
                            fetchData();
                        }}>

                            {bulkMode ? (
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-brand-muted mb-2">Hashtags (comma separated)</label>
                                    <textarea name="bulkTags" className="w-full border border-gray-200 rounded-xl p-3 h-32 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" placeholder="DeFi, Generative Art, Gaming"></textarea>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-brand-muted mb-2">Name / Label</label>
                                        <input name={activeTab === 'categories' ? 'name' : 'label'} defaultValue={activeTab === 'categories' ? editingItem?.name : editingItem?.label} className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" required />
                                    </div>

                                    {activeTab === 'categories' && (
                                        <div>
                                            <label className="block text-sm font-bold text-brand-muted mb-2">Icon (Emoji)</label>
                                            <input name="icon" defaultValue={editingItem?.icon} className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" placeholder="🎨" />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-brand-muted mb-2">Sort Order</label>
                                        <input name="sortOrder" type="number" defaultValue={editingItem?.sortOrder || 0} className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
                                    </div>

                                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <input type="checkbox" name="isActive" defaultChecked={editingItem?.isActive ?? true} className="w-5 h-5 text-brand-primary rounded focus:ring-brand-primary" />
                                        <label className="font-medium text-brand-dark">Active</label>
                                    </div>

                                    {activeTab === 'hashtags' && (
                                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <input type="checkbox" name="isTrending" defaultChecked={editingItem?.isTrending} className="w-5 h-5 text-brand-primary rounded focus:ring-brand-primary" />
                                            <label className="font-medium text-brand-dark">Trending 🔥</label>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                                <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" className="text-gray-500 hover:text-gray-800">Cancel</Button>
                                <Button type="submit" variant="primary">Save</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
