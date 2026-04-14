'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/Card';


interface DiscoverySettingsProps {
    address: string;
}

export default function DiscoverySettings({ address }: DiscoverySettingsProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [hashtags, setHashtags] = useState<any[]>([]);
    const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
    const [selectedHashtagIds, setSelectedHashtagIds] = useState<string[]>([]);

    // UI State
    const [hashtagSearch, setHashtagSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!address) return;

        const fetchAll = async () => {
            const [catsRes, tagsRes, myRes] = await Promise.all([
                fetch('/api/taxonomy/categories').then(r => r.json()),
                fetch('/api/taxonomy/hashtags').then(r => r.json()),
                fetch(`/api/creators/${address}/taxonomy`).then(r => r.json())
            ]);

            if (Array.isArray(catsRes) && catsRes.length > 0) {
                setCategories(catsRes);
            } else {
                // Fallback if DB is empty so user can still select categories
                setCategories([
                    { id: 'art', name: 'Art', icon: '🎨', isActive: true },
                    { id: 'gaming', name: 'Gaming', icon: '🎮', isActive: true },
                    { id: 'music', name: 'Music', icon: '🎵', isActive: true },
                    { id: 'tech', name: 'Tech', icon: '💻', isActive: true },
                    { id: 'podcast', name: 'Podcast', icon: '🎙️', isActive: true }
                ]);
            }
            if (Array.isArray(tagsRes)) setHashtags(tagsRes);

            if (myRes) {
                setSelectedCatIds(myRes.categoryIds || []);
                setSelectedHashtagIds(myRes.hashtagIds || []);
            }
        };

        fetchAll();
    }, [address]);

    const toggleCategory = (id: string) => {
        if (selectedCatIds.includes(id)) {
            setSelectedCatIds(prev => prev.filter(c => c !== id));
        } else {
            if (selectedCatIds.length >= 3) return alert('Max 3 categories allowed.');
            setSelectedCatIds(prev => [...prev, id]);
        }
    };

    const addHashtag = (tag: any) => {
        if (selectedHashtagIds.includes(tag.id)) return;
        if (selectedHashtagIds.length >= 10) return alert('Max 10 hashtags allowed.');
        setSelectedHashtagIds(prev => [...prev, tag.id]);
        setHashtagSearch('');
        setShowSuggestions(false);
    };

    const removeHashtag = (id: string) => {
        setSelectedHashtagIds(prev => prev.filter(h => h !== id));
    };

    const filteredHashtags = hashtags
        .filter(h => h.label.toLowerCase().includes(hashtagSearch.toLowerCase()))
        .filter(h => !selectedHashtagIds.includes(h.id))
        .slice(0, 5);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/creators/${address}/taxonomy`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryIds: selectedCatIds, hashtagIds: selectedHashtagIds })
            });
            if (res.ok) alert('Discovery settings saved!');
            else alert('Failed to save.');
        } catch (e) {
            console.error(e);
            alert('Error saving.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card variant="surface" padding="lg">
            <h3 className="text-h3 mb-6">Discovery</h3>
            <p className="text-gray-500 mb-6 text-sm">Help fans find you on the Explore page.</p>

            {/* Categories */}
            <div className="mb-8">
                <label className="block text-sm font-semibold uppercase mb-3 text-gray-500 tracking-wider">Categories (Max 3)</label>
                <div className="flex flex-wrap gap-2">
                    {categories.filter(c => c.isActive).map(cat => {
                        const isSelected = selectedCatIds.includes(cat.id);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => toggleCategory(cat.id)}
                                className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all shadow-sm ${isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform -translate-y-0.5'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Hashtags */}
            <div className="mb-8">
                <label className="block text-sm font-semibold uppercase mb-3 text-gray-500 tracking-wider">Hashtags (Max 10)</label>

                {/* Selected Chips */}
                <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                    {selectedHashtagIds.map(id => {
                        const tag = hashtags.find(h => h.id === id);
                        return (
                            <span key={id} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-800 font-medium">
                                #{tag?.label || id}
                                <button onClick={() => removeHashtag(id)} className="hover:text-red-500 ml-1 font-bold px-1">×</button>
                            </span>
                        );
                    })}
                    {selectedHashtagIds.length === 0 && <span className="text-sm text-gray-400 italic">No hashtags selected</span>}
                </div>

                {/* Search Input */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search hashtags..."
                        value={hashtagSearch}
                        onChange={(e) => { setHashtagSearch(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && hashtagSearch && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-xl max-h-56 overflow-y-auto">
                            {filteredHashtags.length > 0 ? (
                                filteredHashtags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => addHashtag(tag)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex justify-between border-b border-gray-50 last:border-none"
                                    >
                                        <span className="font-medium">#{tag.label}</span>
                                        {tag.isTrending && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold">🔥 Trending</span>}
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-gray-500 text-center">
                                    No matching tags found.
                                </div>
                            )}
                        </div>
                    )}
                    {/* Backdrop to close suggestions */}
                    {showSuggestions && (
                        <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} style={{ background: 'transparent' }} />
                    )}
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-3 rounded-lg font-bold transition-all shadow-lg text-white flex items-center justify-center gap-2 
                    ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:transform hover:-translate-y-0.5'}`}
            >
                {saving ? 'Saving...' : 'Save Discovery Settings'}
            </button>
        </Card>
    );
}
