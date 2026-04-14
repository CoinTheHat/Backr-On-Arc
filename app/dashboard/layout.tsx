'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import { useToast } from '../components/Toast';
import WalletButton from '../components/WalletButton';
import {
    LayoutDashboard,
    Users,
    FileText,
    DollarSign,
    Settings,
    LogOut,
    Menu,
    Bell,
    Plus,
    ChevronRight,
    Rocket,
    Crown,
    Briefcase,
    Zap
} from 'lucide-react';

import { useCommunity } from '../context/CommunityContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { showToast, ToastComponent } = useToast();
    const [mounted, setMounted] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auth Protection: Redirect to /login if not connected
    // Wait a bit for wagmi to reconnect before redirecting
    const [authChecked, setAuthChecked] = useState(false);
    useEffect(() => {
        if (!mounted) return;
        const timer = setTimeout(() => {
            setAuthChecked(true);
        }, 1500); // Give wagmi 1.5s to reconnect
        return () => clearTimeout(timer);
    }, [mounted]);

    useEffect(() => {
        if (authChecked && !isConnected) {
            router.push('/login');
        }
    }, [authChecked, isConnected, router]);

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    // Fetch Profile & Handle Onboarding Redirect
    useEffect(() => {
        const fetchProfile = async () => {
            if (!address) return;

            // Check if profile exists in Supabase
            // Check if profile exists via API
            try {
                const res = await fetch(`/api/creators?address=${address}`);
                const data = await res.json();

                // Any connected wallet can use the dashboard as a supporter.
                // Creator profile is optional — dashboard shows supporter view if no contract.
                if (data && data.address) {
                    setProfile(data);
                } else {
                    // No profile yet - still allow dashboard access as supporter
                    setProfile({ address, isSupporter: true });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                setProfile({ address, isSupporter: true });
            }
        };
        if (isConnected) {
            fetchProfile();
        }
    }, [address, router, isConnected]);

    if (!mounted) return null;

    // Access Control - show loader while redirecting if not connected
    if (!isConnected) {
        return null;
    }

    if (!address) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-mist text-slate-900 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
                    <h1 className="text-2xl font-bold mb-4 font-serif">Setting up wallet...</h1>
                    <div className="flex justify-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100"></div>
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Detect creator status from profile
    const isCreator = !!(profile?.contractAddress && profile.contractAddress !== '0x0000000000000000000000000000000000000000');

    const creatorMenu = [
        { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Membership', path: '/dashboard/membership', icon: <Crown size={20} /> },
        { label: 'Members', path: '/dashboard/audience', icon: <Users size={20} /> },
        { label: 'Posts', path: '/community', icon: <FileText size={20} /> },
        { label: 'Earnings', path: '/dashboard/earnings', icon: <DollarSign size={20} /> },
        { label: 'Commissions', path: '/dashboard/jobs', icon: <Briefcase size={20} /> },
        { label: 'Nanopayments', path: '/nanopayments', icon: <Zap size={20} /> },
        { label: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
    ];

    const supporterMenu = [
        { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Explore', path: '/explore', icon: <Users size={20} /> },
        { label: 'My Feed', path: '/feed', icon: <FileText size={20} /> },
        { label: 'My Memberships', path: '/memberships', icon: <Crown size={20} /> },
        { label: 'Nanopayments', path: '/nanopayments', icon: <Zap size={20} /> },
        { label: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
    ];

    const menuItems = isCreator ? creatorMenu : supporterMenu;

    const currentTitle = menuItems.find(i => i.path === pathname)?.label || 'Overview';

    const handleLogout = async () => {
        disconnect();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-mist text-slate-900 font-sans flex overflow-hidden">
            {ToastComponent}

            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full p-6">
                    {/* Brand */}
                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-3 mb-10 pl-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white shadow-lg shadow-slate-800/20">
                            <Rocket size={16} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 font-display">Backr</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/${address}`)}>
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {(profile?.avatarUrl || profile?.profileImage) ? (
                                    <img src={profile.avatarUrl || profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Users size={16} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate text-slate-900">{profile?.name || 'Creator'}</p>
                                <p className="text-xs text-slate-400 truncate">View Public Page</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors">
                            <LogOut size={18} />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-64 relative">

                {/* Header */}
                <header className="sticky top-0 z-30 bg-mist/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/50">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 -ml-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center text-xs text-slate-400 gap-1">
                            <span>Studio</span>
                            <ChevronRight size={12} />
                            <span className="text-primary font-medium">{currentTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => showToast('No new notifications', 'info')}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-mist"></span>
                        </button>
                        {isCreator ? (
                            <button
                                onClick={() => router.push('/community/new-post')}
                                className="bg-gradient-to-r from-primary to-fuchsia-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 hover:shadow-primary/30 transition-all active:scale-95"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Create Post</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/explore')}
                                className="bg-gradient-to-r from-primary to-fuchsia-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 hover:shadow-primary/30 transition-all active:scale-95"
                            >
                                <Users size={16} />
                                <span className="hidden sm:inline">Explore Creators</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </div>

            </main>
        </div>
    );
}
