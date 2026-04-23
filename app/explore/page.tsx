'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import SiteFooter from '../components/SiteFooter';
import { Rocket, Search, Music, Mic, Palette, Camera, Code, Utensils, Film, ChevronRight, ArrowRight, Users, Sparkles, User, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';

const CATEGORIES = [
    { name: 'All', icon: <Sparkles size={16} />, color: '#8c2bee' },
    { name: 'Music', icon: <Music size={16} />, color: '#FF6B35' },
    { name: 'Podcasts', icon: <Mic size={16} />, color: '#0EA5E9' },
    { name: 'Art', icon: <Palette size={16} />, color: '#EC4899' },
    { name: 'Film', icon: <Film size={16} />, color: '#EF4444' },
    { name: 'Food', icon: <Utensils size={16} />, color: '#F59E0B' },
    { name: 'Tech', icon: <Code size={16} />, color: '#10B981' },
];

const CATEGORY_COLORS: Record<string, string> = {
    Music: '#FF6B35',
    Podcasts: '#0EA5E9',
    Art: '#8c2bee',
    Film: '#EF4444',
    Food: '#F59E0B',
    Tech: '#10B981',
};

export default function Explore() {
    const router = useRouter();
    const { address } = useAccount();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeFeatured, setActiveFeatured] = useState(0);
    const [myMemberships, setMyMemberships] = useState<any[]>([]);
    const [loadingMemberships, setLoadingMemberships] = useState(true);
    const [creators, setCreators] = useState<any[]>([]);
    const [loadingCreators, setLoadingCreators] = useState(true);

    // Fetch creators from API. We show everyone who has a profile row —
    // creators without a deployed subscription contract still have real PPV
    // posts and tips, which matters for discovery on a fresh platform.
    useEffect(() => {
        fetch('/api/creators')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setCreators(data);
            })
            .catch(() => {})
            .finally(() => setLoadingCreators(false));
    }, []);

    // Auto-rotate featured (based on real creator count)
    useEffect(() => {
        if (creators.length === 0) return;
        const timer = setInterval(() => setActiveFeatured(p => (p + 1) % Math.min(creators.length, 3)), 4000);
        return () => clearInterval(timer);
    }, [creators.length]);

    // Fetch My Memberships
    useEffect(() => {
        if (!address) {
            setLoadingMemberships(false);
            return;
        }

        const fetchMemberships = async () => {
            try {
                const res = await fetch(`/api/subscriptions?subscriber=${address}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Unique creators only (in case multiple tiers for same creator)
                    const unique = data.filter((v, i, a) => a.findIndex(t => (t.creatorAddress === v.creatorAddress)) === i);
                    setMyMemberships(unique);
                }
            } catch (e) {
                console.error("Failed to fetch memberships", e);
            } finally {
                setLoadingMemberships(false);
            }
        };
        fetchMemberships();
    }, [address]);

    // Normalize creator data (real API shape vs mock shape)
    const normalizedCreators = creators.map((c: any) => ({
        address: c.address,
        username: c.username,
        name: c.name || c.username || 'Unnamed',
        category: c.category || 'Creator',
        members: c.memberCount || '0',
        tagline: c.bio || 'Building on Backr',
        cover: c.coverImage || c.profileImage || c.avatarUrl || '',
        avatar: c.profileImage || c.avatarUrl || '',
        color: CATEGORY_COLORS[c.category] || '#8c2bee',
    }));

    const filteredCreators = selectedCategory === 'All'
        ? normalizedCreators
        : normalizedCreators.filter((c: any) => c.category === selectedCategory);

    const searchFiltered = searchQuery
        ? filteredCreators.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : filteredCreators;

    const featuredList = normalizedCreators.slice(0, 3);
    const featured = featuredList[activeFeatured] || null;

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [membershipsOpen, setMembershipsOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const membershipsRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close menus on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
            if (membershipsRef.current && !membershipsRef.current.contains(e.target as Node)) setMembershipsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Fetch user profile
    useEffect(() => {
        if (address) {
            fetch(`/api/creators?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.address) setProfile(data);
                }).catch(() => { });
        }
    }, [address]);

    const displayName = profile?.name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');
    const { disconnect } = useDisconnect();

    const handleLogout = async () => {
        setUserMenuOpen(false);
        disconnect();
        router.push('/');
    };

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
            if (membershipsRef.current && !membershipsRef.current.contains(e.target as Node)) setMembershipsOpen(false);
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Search functionality matching main page
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/creators?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data.slice(0, 5) : []);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreatorClick = (creator: any) => {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        // Navigate to creator page using username or address
        const slug = creator.username || creator.address;
        router.push(`/${slug}`);
    };

    return (
        <div className="min-h-screen bg-mist text-slate-900 font-sans">
            {/* ═══ NAVIGATION ═══ */}
            <nav className={`sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between transition-all duration-500 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm`}>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <Rocket size={18} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">Backr</span>
                </div>

                <div className="flex gap-4 items-center">
                    {/* SEARCH - MOVED TO RIGHT */}
                    <div className="hidden md:block relative" ref={searchRef}>
                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full font-medium transition-all hover:-translate-y-0.5 bg-slate-100 text-slate-900 border border-slate-200"
                        >
                            <Search size={18} />
                        </button>
                        {searchOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-2 z-50 animate-fade-in-up">
                                <input
                                    type="text"
                                    placeholder="Search creators..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    autoFocus
                                />
                                {searchQuery.length >= 2 && (
                                    <div className="mt-2 border-t border-slate-100 pt-2">
                                        {isSearching ? (
                                            <div className="flex items-center justify-center py-4 text-slate-500">
                                                <Loader2 size={20} className="animate-spin" />
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map((creator: any) => (
                                                <button
                                                    key={creator.address}
                                                    onClick={() => handleCreatorClick(creator)}
                                                    className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-slate-50 rounded-xl transition-colors"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                                        {creator.profileImage || creator.avatarUrl ? (
                                                            <img src={creator.profileImage || creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 text-sm truncate">{creator.name}</p>
                                                        {creator.username && (
                                                            <p className="text-xs text-slate-500 truncate">@{creator.username}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="py-4 text-center text-slate-500 text-sm">
                                                No creators found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* MEMBERSHIPS DROPDOWN */}
                    {address && (
                        <div className="relative" ref={membershipsRef}>
                            <button
                                onClick={() => setMembershipsOpen(!membershipsOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 ${membershipsOpen ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-600 border border-slate-200'}`}
                            >
                                <div className="relative">
                                    <Users size={18} />
                                    {myMemberships.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                                    )}
                                </div>
                                <span className="hidden md:inline">Memberships</span>
                            </button>

                            {membershipsOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden py-2 z-50 animate-fade-in-up">
                                    <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Communities</h3>
                                        {myMemberships.length > 0 && <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{myMemberships.length}</span>}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {myMemberships.length > 0 ? (
                                            myMemberships.map((sub, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { router.push(`/${sub.creatorAddress}`); setMembershipsOpen(false); }}
                                                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                                                >
                                                    <div className="relative w-10 h-10 shrink-0">
                                                        <img
                                                            src={sub.creatorAvatar || "https://via.placeholder.com/150"}
                                                            alt={sub.creatorName}
                                                            className="w-full h-full rounded-full object-cover border border-slate-100"
                                                        />
                                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 text-sm truncate">{sub.creatorName}</p>
                                                        <p className="text-xs text-slate-500 truncate">@{sub.creatorUsername || sub.creatorAddress?.slice(0, 6)}</p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-6 text-center text-slate-500">
                                                <p className="text-sm font-medium">No memberships yet.</p>
                                                <p className="text-xs mt-1">Join a creator to see them here!</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                                        <button onClick={() => { router.push('/explore'); setMembershipsOpen(false); }} className="text-xs font-bold text-primary hover:underline">
                                            Find more creators
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {address ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 bg-slate-100 text-slate-900 border border-slate-200`}
                            >
                                <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                    {(profile?.avatarUrl || profile?.profileImage) ? (
                                        <img src={profile.avatarUrl || profile.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={14} className="text-slate-600" />
                                    )}
                                </div>
                                <span className="pr-1">{displayName}</span>
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden py-2 z-50 animate-fade-in-up">
                                    <button
                                        onClick={() => { setUserMenuOpen(false); router.push('/dashboard'); }}
                                        className="flex items-center gap-3 w-full px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <LayoutDashboard size={16} className="text-slate-400" />
                                        Creator Studio
                                    </button>
                                    <div className="h-px bg-slate-100 mx-3" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-5 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => router.push('/login')} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:-translate-y-0.5 shadow-lg shadow-slate-900/20">
                            Get Started
                        </button>
                    )}
                </div>
            </nav>

            <main>
                {/* ═══ FEATURED HERO ═══ */}
                {featured && (
                    <section className="relative h-[60vh] md:h-[70vh] overflow-hidden bg-slate-900">
                        {featuredList.map((fc: any, i: number) => (
                            <div key={fc.address || i} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === activeFeatured ? 1 : 0 }}>
                                {fc.cover ? (
                                    <img src={fc.cover} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                            </div>
                        ))}
                        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 z-10">
                            <div className="max-w-4xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white/90"
                                        style={{ backgroundColor: featured.color }}>
                                        {featured.category}
                                    </span>
                                </div>
                                <h1 onClick={() => router.push(`/${featured.username || featured.address}`)} className="text-4xl md:text-7xl font-bold text-white leading-[0.95] tracking-tight mb-4 cursor-pointer hover:opacity-90"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                                    {featured.name}
                                </h1>
                                <p className="text-white/60 text-lg md:text-xl max-w-lg mb-8">{featured.tagline}</p>
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══ CATEGORIES ═══ */}
                <section className="sticky top-[62px] z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 md:px-10">
                    <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto py-4 scrollbar-hide">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedCategory === cat.name
                                    ? 'text-white shadow-lg scale-105'
                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                                    }`}
                                style={selectedCategory === cat.name ? { backgroundColor: cat.color } : {}}
                            >
                                {cat.icon}
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ═══ GRID ═══ */}
                <section className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
                    {loadingCreators ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-slate-400" />
                        </div>
                    ) : searchFiltered.length === 0 ? (
                        <div className="text-center py-20">
                            <Users size={48} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No creators found</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                {searchQuery || selectedCategory !== 'All'
                                    ? 'Try a different search or category'
                                    : 'No creators have deployed contracts yet. Be the first!'}
                            </p>
                            {!searchQuery && selectedCategory === 'All' && (
                                <button onClick={() => router.push('/onboarding')} className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-colors">
                                    Become a Creator <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchFiltered.map((creator: any) => (
                                <div
                                    key={creator.address}
                                    onClick={() => router.push(`/${creator.username || creator.address}`)}
                                    className="group relative rounded-3xl overflow-hidden cursor-pointer bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                                >
                                    <div className="relative h-52 overflow-hidden bg-slate-200">
                                        {creator.cover ? (
                                            <img src={creator.cover} alt={creator.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 group-hover:scale-110 transition-transform duration-700" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className="absolute top-4 left-4">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white/90 backdrop-blur-sm"
                                                style={{ backgroundColor: `${creator.color}CC` }}>
                                                {creator.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 relative">
                                        <div className="w-14 h-14 rounded-full border-4 border-white object-cover absolute -top-7 left-5 shadow-md bg-slate-200 overflow-hidden flex items-center justify-center">
                                            {creator.avatar ? (
                                                <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div className="mt-6">
                                            <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors"
                                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                                                {creator.name}
                                            </h3>
                                            {creator.username && (
                                                <p className="text-xs text-slate-400 mb-2">@{creator.username}</p>
                                            )}
                                            <p className="text-sm text-slate-500 line-clamp-2">{creator.tagline}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
