'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Button from '../components/Button';
import BrandLogo from '../components/BrandLogo';
import WalletButton from '../components/WalletButton';
import { useAccount } from 'wagmi';
import { Search, Loader2, User } from 'lucide-react';

export default function SupporterLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isConnected } = useAccount();

    // Search State (matching main page)
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { label: 'Explore', path: '/explore' },
        { label: 'Feed', path: '/feed' },
        { label: 'My Memberships', path: '/memberships' },
        { label: 'Nanopayments', path: '/nanopayments' },
    ];

    // Close search on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

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
        router.push(`/${creator.username || creator.address}`);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-page)', color: 'var(--color-text-primary)' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .nav-link {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    color: var(--color-text-secondary);
                    font-weight: 500;
                    padding: 8px 0;
                }
                .nav-link:hover {
                    color: var(--color-text-primary);
                }
                .nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: var(--color-brand-blue);
                    transform: scaleX(0);
                    transition: transform 0.2s ease;
                    transform-origin: center;
                }
                .nav-link.active {
                    color: var(--color-text-primary);
                    font-weight: 600;
                }
                .nav-link.active::after {
                    transform: scaleX(1);
                }
                .search-input {
                    transition: all 0.3s ease;
                }
                .search-input:focus {
                    box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
                    border-color: var(--color-brand-blue) !important;
                }
                
                /* Desktop/Mobile Visibility */
                .desktop-nav { display: flex; }
                .mobile-bottom-nav { display: none; }
                
                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                    .mobile-bottom-nav { display: flex !important; }
                    .nav-search { display: none !important; } 
                    
                    /* Adjust padding for bottom nav */
                    main { padding-bottom: 80px !important; }
                }
            `}} />

            {/* Top Navigation */}
            <nav className="sticky-blur" style={{
                padding: '0 min(24px, 5vw)',
                height: 'var(--header-height)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '24px'
            }}>
                {/* Left: Logo + Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                    <div onClick={() => router.push('/')} className="cursor-pointer">
                        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Backr</h1>
                    </div>

                    <div className="desktop-nav" style={{ gap: '32px', alignItems: 'center' }}>
                        {navItems.map(item => (
                            <div
                                key={item.path}
                                className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                                onClick={() => router.push(item.path)}
                                style={{ cursor: 'pointer', fontSize: '0.95rem' }}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center: Search Bar (Replaced with Main Page Expandable Button) */}
                <div className="nav-search relative" ref={searchRef}>
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all hover:-translate-y-0.5 bg-slate-100 text-slate-900 border border-slate-200`}
                    >
                        <Search size={16} />
                    </button>
                    {searchOpen && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-2 z-50 animate-fade-in-up">
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

                {/* Right: Actions */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {isConnected && (
                        <div
                            className="hover-lift"
                            style={{
                                position: 'relative',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '50%',
                                background: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border)'
                            }}
                            onClick={() => router.push('/feed')}
                        >
                            <span style={{ fontSize: '1.1rem' }}>🔔</span>
                            {/* Notification Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '0px',
                                right: '0px',
                                width: '10px',
                                height: '10px',
                                background: 'var(--color-error)',
                                borderRadius: '50%',
                                border: '2px solid var(--color-bg-surface)'
                            }}></div>
                        </div>
                    )}

                    <WalletButton />
                </div>
            </nav>

            {/* Main Content */}
            <main style={{ flex: 1, width: '100%', paddingBottom: '96px' }}>
                <div className="page-container" style={{ paddingTop: '24px' }}>
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <div className="mobile-bottom-nav" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(16px)',
                borderTop: '1px solid var(--color-border)',
                padding: '12px 24px 24px', // Extra padding for safe area
                justifyContent: 'space-between',
                zIndex: 100,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
            }}>
                {navItems.map(item => {
                    const isActive = pathname === item.path;
                    return (
                        <div
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                                transition: 'all 0.2s',
                                flex: 1
                            }}
                        >
                            <div style={{
                                fontSize: '1.5rem',
                                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                {item.label === 'Explore' ? '🧭' : item.label === 'Feed' ? '⚡' : '🎟️'}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 700 : 500 }}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
