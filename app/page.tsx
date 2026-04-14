'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import SiteFooter from './components/SiteFooter';
import { Rocket, Menu, X, ArrowRight, ArrowDown, ChevronRight, Search, LogOut, LayoutDashboard, User, Loader2 } from 'lucide-react';

/* ─── Pixabay / Picsum (Reliable & Free) ─── */
const img = (id: number, w = 1200) => `https://picsum.photos/id/${id}/${w}/${Math.floor(w * 0.6)}`;

const HERO_SLIDES = [
    {
        headline: ['Your music.', 'Your stage.'],
        creator: { name: 'Luna Nova', desc: 'is building an independent music empire with her fans.', link: '/explore' },
        bg: img(452, 1920),   // concert
        accent: '#FF6B35',
    },
    {
        headline: ['Create boldly.', 'Earn freely.'],
        creator: { name: 'Kai Studios', desc: 'is turning digital art into a full-time career.', link: '/explore' },
        bg: img(314, 1920),    // art/abstract
        accent: '#8c2bee',
    },
    {
        headline: ['Your stories.', 'Your rules.'],
        creator: { name: 'Mira Chen', desc: 'is exploring culture, identity, and community through writing.', link: '/explore' },
        bg: img(366, 1920),    // writing
        accent: '#0EA5E9',
    },
    {
        headline: ['From passion', 'to paycheck.'],
        creator: { name: 'DevStream', desc: 'is teaching millions to code — and getting paid for it.', link: '/explore' },
        bg: img(370, 1920),   // tech
        accent: '#10B981',
    },
];

const SHOWCASE_CREATORS = [
    { name: 'Aria Beats', tag: 'Producer', members: '2.4K', img: img(158, 600), color: '#FF6B35' },
    { name: 'PixelForge', tag: 'Visual Artist', members: '8.1K', img: img(120, 600), color: '#8c2bee' },
    { name: 'The Culture Pod', tag: 'Podcaster', members: '5.3K', img: img(338, 600), color: '#0EA5E9' },
    { name: 'CodeWithSara', tag: 'Educator', members: '12K', img: img(201, 600), color: '#10B981' },
    { name: 'Frame by Frame', tag: 'Filmmaker', members: '3.7K', img: img(193, 600), color: '#EF4444' },
    { name: 'Neon Kitchen', tag: 'Chef', members: '6.9K', img: img(292, 600), color: '#F59E0B' },
];

export default function Home() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => { setMounted(true); }, []);

    // Use mounted check to avoid hydration mismatch
    const authenticated = mounted && isConnected;
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fetch user profile
    useEffect(() => {
        if (address) {
            fetch('/api/creators')
                .then(res => res.json())
                .then(creators => {
                    const found = creators.find((c: any) => c.address === address);
                    if (found) setProfile(found);
                }).catch(() => { });
        }
    }, [address]);

    // Close menus on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const displayName = profile?.name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

    const handleLogout = async () => {
        setUserMenuOpen(false);
        disconnect();
    };

    // Search functionality
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
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreatorClick = (creator: any) => {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        router.push(`/${creator.username || creator.address}`);
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-rotate hero slides
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Track mouse for parallax
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
            x: (e.clientX - rect.left) / rect.width - 0.5,
            y: (e.clientY - rect.top) / rect.height - 0.5,
        });
    };

    const slide = HERO_SLIDES[activeSlide];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">

            {/* ═══ NAVIGATION ═══ */}
            <nav className={`fixed top-0 inset-x-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm' : ''}`}>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <Rocket size={18} />
                    </div>
                    <span className={`text-xl font-bold tracking-tight transition-colors duration-500 ${scrolled ? 'text-slate-900' : 'text-white'}`}>Backr</span>
                </div>
                <div className={`hidden md:flex items-center gap-8 transition-colors duration-500 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                    <div className="relative" ref={searchRef}>
                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all hover:-translate-y-0.5 ${scrolled ? 'bg-slate-100 text-slate-900' : 'bg-white/15 backdrop-blur-md text-white border border-white/20'}`}
                        >
                            <Search size={16} />
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
                    <button onClick={() => router.push('/explore')} className="font-medium hover:opacity-100 opacity-80 transition-opacity">Explore</button>
                    <button onClick={() => router.push('/dashboard')} className="font-medium hover:opacity-100 opacity-80 transition-opacity">Creators</button>
                    {authenticated ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 ${scrolled ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'bg-white/15 backdrop-blur-md text-white border border-white/20'}`}
                            >
                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                    {(profile?.avatarUrl || profile?.profileImage) ? (
                                        <img src={profile.avatarUrl || profile.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={12} className={scrolled ? 'text-slate-600' : 'text-white'} />
                                    )}
                                </div>
                                <span className="pr-0.5">{displayName}</span>
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden py-2 z-50 animate-fade-in-up">
                                    <button
                                        onClick={() => { setUserMenuOpen(false); router.push('/dashboard'); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <LayoutDashboard size={16} className="text-slate-400" />
                                        Creator Studio
                                    </button>
                                    <div className="h-px bg-slate-100 mx-3" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Çıkış Yap
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => router.push('/dashboard')} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 ${scrolled ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                            Get Started
                        </button>
                    )}
                </div>
                <button className={`md:hidden transition-colors ${scrolled ? 'text-slate-700' : 'text-white'}`} onClick={() => setMobileMenuOpen(true)}>
                    <Menu size={28} />
                </button>
            </nav>

            {/* ═══ MOBILE MENU OVERLAY ═══ */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-white animate-fade-in">
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                    <Rocket size={18} />
                                </div>
                                <span className="text-xl font-bold tracking-tight text-slate-900">Backr</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-900">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
                            <button onClick={() => { router.push('/explore'); setMobileMenuOpen(false); }} className="p-4 text-lg font-bold text-left hover:bg-slate-50 rounded-2xl transition-colors">
                                Explore Creators
                            </button>
                            <button onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }} className="p-4 text-lg font-bold text-left hover:bg-slate-50 rounded-2xl transition-colors">
                                Creator Studio
                            </button>
                            <div className="h-px bg-slate-100 my-2" />
                            {authenticated ? (
                                <>
                                    <button onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-4 w-full text-left hover:bg-slate-50 rounded-2xl transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                            {(profile?.avatarUrl || profile?.profileImage) ? (
                                                <img src={profile.avatarUrl || profile.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{displayName}</p>
                                            <p className="text-xs text-slate-500 font-medium">Logged in</p>
                                        </div>
                                    </button>
                                    <button onClick={() => { router.push('/dashboard/settings'); setMobileMenuOpen(false); }} className="p-4 text-lg font-medium text-left hover:bg-slate-50 rounded-2xl transition-colors text-slate-600">
                                        Settings
                                    </button>
                                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="p-4 text-lg font-bold text-left hover:bg-rose-50 rounded-2xl transition-colors text-rose-500 flex items-center gap-2">
                                        <LogOut size={20} />
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }} className="mt-4 w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-200/50">
                                    Get Started
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ HERO: FULL-VIEWPORT ROTATING SLIDES ═══ */}
            <section
                ref={heroRef}
                onMouseMove={handleMouseMove}
                className="relative h-screen w-full overflow-hidden cursor-default select-none"
            >
                {/* Background Images */}
                {HERO_SLIDES.map((s, i) => (
                    <div key={i} className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
                        style={{ opacity: i === activeSlide ? 1 : 0 }}>
                        <div className="absolute inset-[-20px] bg-cover bg-center transition-transform duration-[1200ms]"
                            style={{
                                backgroundImage: `url(${s.bg})`,
                                transform: i === activeSlide
                                    ? `scale(1.05) translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`
                                    : 'scale(1.1)',
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                    </div>
                ))}

                {/* Hero Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 lg:p-24 z-10">
                    <div className="mb-8 md:mb-12">
                        {slide.headline.map((line, i) => (
                            <h1 key={`${activeSlide}-${i}`}
                                className="text-[clamp(3rem,10vw,8rem)] md:text-[clamp(4rem,9vw,9rem)] font-bold text-white leading-[0.9] tracking-tight animate-fade-in-up"
                                style={{
                                    animationDelay: `${i * 150}ms`,
                                    fontFamily: 'var(--font-serif), Georgia, serif',
                                }}>
                                {line}
                            </h1>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="w-12 h-12 rounded-full border-2 border-white/40 overflow-hidden bg-white/10">
                            <img src={slide.bg} alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-white/80 text-sm md:text-base font-medium max-w-md">
                            <span className="text-white font-bold">{slide.creator.name}</span> {slide.creator.desc}
                            <button onClick={() => router.push(slide.creator.link)} className="ml-2 inline-flex items-center text-white/60 hover:text-white transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══ CREATOR SHOWCASE GRID ═══ */}
            <section className="py-20 md:py-32 px-6 md:px-10 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Discover</p>
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                                Trending creators
                            </h2>
                        </div>
                        <button onClick={() => router.push('/explore')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors group">
                            Explore all <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {SHOWCASE_CREATORS.map((c, i) => (
                            <div key={i} onClick={() => router.push('/explore')}
                                className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-slate-100">
                                <img src={c.img} alt={c.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                                <div className="absolute top-6 left-6 w-8 h-1 rounded-full transition-all duration-500 group-hover:w-16"
                                    style={{ backgroundColor: c.color }} />
                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/80 backdrop-blur-sm">
                                            {c.tag}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                                        {c.name}
                                    </h3>
                                    <p className="text-white/50 text-sm font-medium">{c.members} members</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ BOLD STATEMENT SECTIONS ═══ */}
            <section className="relative bg-slate-950 text-white overflow-hidden">
                <div className="relative min-h-[80vh] flex items-center px-8 md:px-16 lg:px-24 py-32">
                    <div className="absolute inset-0">
                        <img src={img(180, 1920)} alt="" className="w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    </div>
                    <div className="relative z-10 max-w-4xl">
                        <h2 className="text-5xl md:text-8xl lg:text-[7rem] font-bold leading-[0.95] tracking-tight mb-8"
                            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                            Creator is now
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">a career.</span>
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl max-w-lg leading-relaxed mb-10">
                            Own your audience. Keep your earnings. Build a creative business that lasts.
                        </p>
                        <button onClick={() => router.push('/dashboard')}
                            className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all hover:-translate-y-0.5 active:translate-y-0">
                            Start creating free
                        </button>
                    </div>
                </div>
            </section>
            <SiteFooter />
        </div>
    );
}
