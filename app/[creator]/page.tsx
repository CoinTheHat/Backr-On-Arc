'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useToast } from '../components/Toast';
import confetti from 'canvas-confetti';
import { formatPrice } from '@/utils/format';
import CheckoutModal from '../components/CheckoutModal';
import TipButton from '../components/TipButton';
import TipJar from '../components/TipJar';
import SupporterLeaderboard from '../components/SupporterLeaderboard';
import WalletButton from '../components/WalletButton';
import { useSend } from '../hooks/useSend';
import { useSubscribe } from '../hooks/useSubscribe';
import { useNanopay } from '../hooks/useNanopay';
import {
    ChevronLeft,
    Share,
    MoreHorizontal,
    Check,
    Lock,
    Heart,
    MessageCircle,
    Zap,
    Shield,
    Rocket,
    Menu,
    X,
    Search,
    LogOut,
    LayoutDashboard,
    User,
    Loader2,
    MessageSquarePlus,
    DollarSign,
    Send,
    CheckCircle,
} from 'lucide-react';

export default function CreatorPage({ params }: { params: Promise<{ creator: string }> }) {
    const { creator } = use(params);
    const creatorId = creator;

    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const router = useRouter();
    const { showToast, ToastComponent } = useToast();

    // Tab State
    const [activeTab, setActiveTab] = useState<'posts' | 'membership' | 'about'>('posts');

    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [creatorTiers, setCreatorTiers] = useState<any[]>([]);
    const [creatorProfile, setCreatorProfile] = useState<any>(null);
    const [realMemberCount, setRealMemberCount] = useState(0);
    const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [activeSubscription, setActiveSubscription] = useState<any>(null);

    // Navbar State (same as home page)
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Payment Hooks
    const { send, txHash: paymentTxHash } = useSend();
    const { subscribe: onChainSubscribe, getCreatorContract } = useSubscribe();
    const { balance: gatewayBalance, deposit: nanopayDeposit, isLoading: nanopayLoading, error: nanopayError } = useNanopay();

    // Nanopayments Deposit Widget State
    const [nanopayCollapsed, setNanopayCollapsed] = useState(false);
    const [nanopayAmount, setNanopayAmount] = useState('5');
    const handleNanopayDeposit = async () => {
        try {
            await nanopayDeposit(nanopayAmount);
            showToast('Deposit successful! Gateway balance updated.', 'success');
        } catch (err) {
            console.error('Nanopay deposit failed:', err);
            showToast('Deposit failed. Please try again.', 'error');
        }
    };

    // Checkout State
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
    const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

    // PPV State
    const [purchasingPostId, setPurchasingPostId] = useState<string | null>(null);

    // Comment State
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
    const [commentContent, setCommentContent] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [postComments, setPostComments] = useState<any[]>([]);

    // Commission Request State
    const [showCommissionForm, setShowCommissionForm] = useState(false);
    const [commissionTitle, setCommissionTitle] = useState('');
    const [commissionDescription, setCommissionDescription] = useState('');
    const [commissionBudget, setCommissionBudget] = useState('');
    const [isSubmittingCommission, setIsSubmittingCommission] = useState(false);
    const [commissionSuccess, setCommissionSuccess] = useState(false);

    // Fetch Data
    useEffect(() => {
        if (!creatorId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Creator Profile
                const resCreators = await fetch('/api/creators');
                const creators = await resCreators.json();

                // Find by address OR username
                const found = creators.find((c: any) =>
                    c.address.toLowerCase() === creatorId.toLowerCase() ||
                    (c.username && c.username.toLowerCase() === creatorId.toLowerCase())
                );

                if (found) {
                    setCreatorProfile(found);
                    const realAddress = found.address;

                    // 2. Fetch Tiers using REAL address
                    fetch(`/api/tiers?creator=${realAddress}`)
                        .then(res => res.json())
                        .then(data => { if (Array.isArray(data)) setCreatorTiers(data); });

                    // 3. Fetch Posts using REAL address and viewer address for unlocking content
                    const viewerParam = address ? `&viewer=${address}` : '';
                    fetch(`/api/posts?address=${realAddress}${viewerParam}`)
                        .then(res => res.json())
                        .then(data => setPosts(data));

                    // 4. Fetch Stats using REAL address
                    fetch(`/api/stats?address=${realAddress}`)
                        .then(res => res.json())
                        .then(data => setRealMemberCount(data.activeMembers || 0));

                    // 5. Check Subscription
                    if (address) {
                        fetch(`/api/subscriptions?subscriber=${address}&creator=${realAddress}`)
                            .then(res => res.json())
                            .then(data => {
                                if (data && data.length > 0) {
                                    const active = data.find((s: any) => new Date(s.expiresAt) > new Date());
                                    if (active) setActiveSubscription(active);
                                }
                            });
                    }
                }
            } catch (error) {
                console.error("Error loading creator data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [creatorId, address, checkoutStatus]);

    // Navbar: Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch user profile (same as home page)
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

    const handleSubscribeClick = (tierIndex: number) => {
        setSelectedTierIndex(tierIndex);
        setCheckoutStatus('idle');
        setCheckoutModalOpen(true);
    };

    const handleConfirmSubscribe = async () => {
        if (selectedTierIndex === null) return;
        const tier = creatorTiers[selectedTierIndex];
        const targetAddress = creatorProfile?.address || creatorId;

        setCheckoutStatus('pending');

        try {
            let txHash: string | undefined;

            // Check if creator has an on-chain subscription contract
            const creatorContractAddr = creatorProfile?.contractAddress;
            const hasContract = creatorContractAddr &&
                creatorContractAddr !== '' &&
                creatorContractAddr !== '0x0000000000000000000000000000000000000000';

            if (hasContract) {
                // On-chain subscribe: USDC approve + contract.subscribe(tierId)
                console.log('[subscribe] Using on-chain contract:', creatorContractAddr);
                txHash = await onChainSubscribe({
                    contractAddress: creatorContractAddr,
                    tierId: selectedTierIndex,
                    amount: tier.price.toString(),
                });
            } else {
                // Fallback: direct USDC transfer (for creators without contract)
                console.log('[subscribe] Fallback: direct USDC transfer');
                txHash = await send(
                    targetAddress,
                    tier.price.toString(),
                    `Subscribe to ${tier.name}`
                );
            }

            if (!txHash) throw new Error("Transaction failed");

            // Save subscription to database
            await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriberAddress: address,
                    creatorAddress: targetAddress,
                    tierId: tier.id,
                    expiry: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
                    txHash
                })
            });

            // Success
            setCheckoutStatus('success');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

            // Refresh subscription state
            if (address) {
                fetch(`/api/subscriptions?subscriber=${address}&creator=${targetAddress}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            const active = data.find((s: any) => new Date(s.expiresAt) > new Date());
                            if (active) setActiveSubscription(active);
                        }
                    });
            }

        } catch (err) {
            console.error(err);
            setCheckoutStatus('error');
        }
    };

    const canViewPost = (post: any) => {
        if (post.isPublic) return true;
        const viewer = address?.toLowerCase();
        const currentCreator = creatorProfile?.address?.toLowerCase();
        // Creator themselves
        if (viewer && currentCreator && viewer === currentCreator) return true;

        // Subscription Check
        if (activeSubscription) return true;

        // PPV purchase check — API returns ppvRequired: false when purchased
        if (post.ppvRequired === false && post.ppvEnabled) return true;

        return false;
    };

    const refreshPosts = async () => {
        if (!creatorProfile?.address) return;
        const viewerParam = address ? `&viewer=${address}` : '';
        const res = await fetch(`/api/posts?address=${creatorProfile.address}${viewerParam}`);
        const data = await res.json();
        setPosts(data);
    };

    const handlePPVPurchase = async (post: any) => {
        setPurchasingPostId(post.id);
        try {
            const tx = await send(creatorProfile.address, String(post.ppvPrice));
            if (!tx) throw new Error('Transaction failed');
            await fetch(`/api/posts/${post.id}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buyerAddress: address, txHash: tx })
            });
            await refreshPosts();
        } catch (err) {
            console.error('PPV purchase failed:', err);
        } finally {
            setPurchasingPostId(null);
        }
    };

    const handleLike = async (postId: string, index: number) => {
        try {
            // Optimistic Update
            const updatedPosts = [...posts];
            updatedPosts[index] = { ...updatedPosts[index], likes: (updatedPosts[index].likes || 0) + 1 };
            setPosts(updatedPosts);

            await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const openComments = async (post: any) => {
        setActiveCommentPost(post);
        setCommentModalOpen(true);
        setPostComments([]);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`);
            const data = await res.json();
            if (Array.isArray(data)) setPostComments(data);
        } catch (error) {
            console.error("Error loading comments:", error);
        }
    };

    const handleCommentSubmit = async () => {
        if (!address || !commentContent || !activeCommentPost) return;
        setIsCommenting(true);
        try {
            const res = await fetch(`/api/posts/${activeCommentPost.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: address,
                    content: commentContent
                })
            });
            const newComment = await res.json();
            setPostComments([...postComments, { ...newComment, username: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'User' }]);
            setCommentContent('');
        } catch (error) {
            console.error("Error submitting comment:", error);
        } finally {
            setIsCommenting(false);
        }
    };

    const handleCommissionSubmit = async () => {
        if (!address || !commissionTitle || !commissionBudget || !creatorProfile?.address) return;
        setIsSubmittingCommission(true);
        try {
            // Step 1: Pay the commission budget via USDC (goes to creator with 5% fee)
            showToast('Confirm payment in your wallet...', 'info');
            const txHash = await send(
                creatorProfile.address,
                commissionBudget,
                `Commission: ${commissionTitle}`
            );

            if (!txHash) throw new Error('Payment failed');

            // Step 2: Record the commission in DB (with txHash as proof of payment)
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterAddress: address,
                    creatorAddress: creatorProfile.address,
                    title: commissionTitle,
                    description: commissionDescription,
                    budget: commissionBudget,
                    txHash,
                }),
            });
            if (res.ok) {
                setCommissionSuccess(true);
                setCommissionTitle('');
                setCommissionDescription('');
                setCommissionBudget('');
                showToast('Commission paid & sent!', 'success');
                confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
                setTimeout(() => {
                    setCommissionSuccess(false);
                    setShowCommissionForm(false);
                }, 2000);
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to submit request', 'error');
            }
        } catch (err: any) {
            console.error('Commission submit error:', err);
            if (err.message?.includes('User rejected')) {
                showToast('Payment cancelled', 'info');
            } else {
                showToast(err.message?.slice(0, 80) || 'Failed to submit request.', 'error');
            }
        } finally {
            setIsSubmittingCommission(false);
        }
    };

    const toggleExpand = (index: number) => {
        setExpandedPosts(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // Navbar functions (same as home page)
    const userDisplayName = profile?.name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

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
            setSearchResults(Array.isArray(data) ? data : []);
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

    const displayName = creatorProfile?.name || `Creator ${creatorId.substring(0, 4)}...`;
    const avatar = creatorProfile?.avatarUrl || creatorProfile?.profileImage;
    const cover = creatorProfile?.coverImage || creatorProfile?.coverUrl;

    return (
        <div className="min-h-screen bg-mist text-slate-900 font-sans pb-24 selection:bg-fuchsia-200">
            {ToastComponent}

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
                    {isConnected ? (
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
                                <span className="pr-0.5">{userDisplayName}</span>
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
                <button className={`md:hidden transition-colors ${scrolled ? 'text-slate-700' : 'text-white'}`} onClick={() => setShowMobileMenu(true)}>
                    <Menu size={28} />
                </button>
            </nav>

            {/* ═══ MOBILE MENU OVERLAY ═══ */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-[60] bg-white animate-fade-in">
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                    <Rocket size={18} />
                                </div>
                                <span className="text-xl font-bold tracking-tight text-slate-900">Backr</span>
                            </div>
                            <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-900">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
                            <button onClick={() => { router.push('/explore'); setShowMobileMenu(false); }} className="p-4 text-lg font-bold text-left hover:bg-slate-50 rounded-2xl transition-colors">
                                Explore Creators
                            </button>
                            <button onClick={() => { router.push('/dashboard'); setShowMobileMenu(false); }} className="p-4 text-lg font-bold text-left hover:bg-slate-50 rounded-2xl transition-colors">
                                Creator Studio
                            </button>
                            <div className="h-px bg-slate-100 my-2" />
                            {isConnected ? (
                                <>
                                    <button onClick={() => { router.push('/dashboard'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-4 w-full text-left hover:bg-slate-50 rounded-2xl transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                            {(profile?.avatarUrl || profile?.profileImage) ? (
                                                <img src={profile.avatarUrl || profile.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{userDisplayName}</p>
                                            <p className="text-xs text-slate-500 font-medium">Logged in</p>
                                        </div>
                                    </button>
                                    <button onClick={() => { router.push('/dashboard/settings'); setShowMobileMenu(false); }} className="p-4 text-lg font-medium text-left hover:bg-slate-50 rounded-2xl transition-colors text-slate-600">
                                        Settings
                                    </button>
                                    <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="p-4 text-lg font-bold text-left hover:bg-rose-50 rounded-2xl transition-colors text-rose-500 flex items-center gap-2">
                                        <LogOut size={20} />
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => { router.push('/dashboard'); setShowMobileMenu(false); }} className="mt-4 w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-200/50">
                                    Get Started
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER COVER IMAGE */}
            <header className="relative h-[280px] md:h-[340px]">
                <div className="absolute inset-0">
                    {cover ? (
                        <img src={cover} alt="Cover" className="w-full h-full object-cover object-center" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-fuchsia-100"></div>
                    )}
                    {/* Bottom gradient only for profile info blending */}
                    <div className="absolute inset-0 bg-gradient-to-t from-mist via-transparent to-transparent"></div>
                </div>
            </header>

            {/* PROFILE INFO */}
            <div className="relative px-6 -mt-20 text-center z-20 max-w-2xl mx-auto">
                <div className="relative inline-block">
                    <div className="w-36 h-36 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-white">
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                <span className="text-4xl">?</span>
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-primary text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                        <Check size={14} strokeWidth={4} />
                    </div>
                </div>

                <h1 className="font-serif text-4xl mt-4 font-bold text-slate-900 tracking-tight">{displayName}</h1>
                <p className="text-slate-500 font-medium mt-2 text-lg">{creatorProfile?.description || "Digital Creator"}</p>

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-6 sm:gap-12 mt-8 pb-8 border-b border-slate-200">
                    <div className="text-center">
                        <span className="block text-xl sm:text-2xl font-bold text-slate-900">{realMemberCount}</span>
                        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-bold">Followers</span>
                    </div>
                    <div className="w-px h-8 sm:h-10 bg-slate-200"></div>
                    <div className="text-center">
                        <span className="block text-xl sm:text-2xl font-bold text-slate-900">{posts.length}</span>
                        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-bold">Posts</span>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">

                {/* Left Column */}
                <div>
                    {/* TABS */}
                    <div className="flex justify-center lg:justify-start gap-2 mb-8 bg-white/50 p-1.5 rounded-full inline-flex backdrop-blur-sm border border-white/50 w-full overflow-x-auto">
                        {['posts', 'membership', 'about'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold capitalize transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab
                                    ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* POSTS TAB */}
                    {
                        activeTab === 'posts' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-serif text-2xl font-bold text-slate-900">Recent Posts</h2>
                                    <button onClick={() => setActiveTab('posts')} className="text-primary font-bold text-sm hover:underline">View all</button>
                                </div>

                                {/* Nanopayments Deposit Widget — shown only when creator has PPV posts */}
                                {posts.some((p: any) => p.ppvRequired) && (
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white mb-6 shadow-md">
                                        <button
                                            type="button"
                                            onClick={() => setNanopayCollapsed(!nanopayCollapsed)}
                                            className="w-full flex items-center justify-between gap-3 text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white/20 rounded-full p-2">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-base">Gasless Micro-Payments</h3>
                                                    <p className="text-xs opacity-80">
                                                        {gatewayBalance != null
                                                            ? `Gateway balance: $${gatewayBalance} USDC`
                                                            : 'Tap to learn more'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs opacity-75">{nanopayCollapsed ? '▼' : '▲'}</span>
                                        </button>

                                        {!nanopayCollapsed && (
                                            <div className="mt-4">
                                                <p className="text-sm opacity-90 mb-4">
                                                    This creator has pay-per-view content. Deposit USDC once to Circle Gateway,
                                                    then unlock all PPV posts with gasless nanopayments.
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                                                        <span className="text-sm opacity-80">$</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={nanopayAmount}
                                                            onChange={(e) => setNanopayAmount(e.target.value)}
                                                            className="w-16 bg-transparent border-none outline-none text-white placeholder-white/50 text-sm font-bold"
                                                            disabled={nanopayLoading}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleNanopayDeposit}
                                                        disabled={nanopayLoading || !isConnected}
                                                        className="bg-white text-indigo-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        {nanopayLoading ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Depositing...
                                                            </>
                                                        ) : !isConnected ? (
                                                            'Connect Wallet'
                                                        ) : (
                                                            `Deposit $${nanopayAmount} to Gateway`
                                                        )}
                                                    </button>
                                                    {gatewayBalance != null && (
                                                        <span className="text-xs opacity-90">
                                                            Current balance: <span className="font-bold">${gatewayBalance}</span>
                                                        </span>
                                                    )}
                                                </div>
                                                {nanopayError && (
                                                    <p className="text-xs mt-3 bg-red-500/20 rounded px-2 py-1">
                                                        {nanopayError}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {posts.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                        <p className="text-slate-400">No posts yet.</p>
                                    </div>
                                ) : (
                                    posts.map((post, i) => {
                                        const locked = !canViewPost(post);

                                        return (
                                            <article key={i} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                                {/* Header */}
                                                <div className="p-6 flex items-center gap-4">
                                                    <img src={avatar || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{displayName}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                            {new Date(post.createdAt).toLocaleDateString()} {locked && (post.ppvRequired && post.ppvPrice ? "• Pay Per View" : "• Members Only")}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Media / Content */}
                                                {post.image ? (
                                                    <div className="aspect-square sm:aspect-video w-full relative bg-slate-100">
                                                        <img src={post.image} alt="Post" className={`w-full h-full object-cover ${locked ? 'blur-xl opacity-50' : ''}`} />
                                                        {locked && (
                                                            <div className="absolute inset-0 flex items-center justify-center p-8">
                                                                <div className="bg-white/80 backdrop-blur-md border border-white/50 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
                                                                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                                                                        <Lock size={28} />
                                                                    </div>
                                                                    <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">Locked Content</h3>
                                                                    <p className="text-sm text-slate-500 mb-6">
                                                                        {post.ppvRequired && post.ppvPrice
                                                                            ? 'Unlock this post or join a membership.'
                                                                            : 'Join the membership to unlock this post.'}
                                                                    </p>
                                                                    <div className="flex flex-col gap-3 w-full">
                                                                        {post.ppvRequired && post.ppvPrice && (
                                                                            <button
                                                                                onClick={() => handlePPVPurchase(post)}
                                                                                disabled={purchasingPostId === post.id}
                                                                                className="bg-primary text-white px-6 py-3 rounded-full font-bold text-sm w-full hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                                                            >
                                                                                {purchasingPostId === post.id ? (
                                                                                    <>
                                                                                        <Loader2 size={16} className="animate-spin" />
                                                                                        Processing...
                                                                                    </>
                                                                                ) : (
                                                                                    `Unlock for $${post.ppvPrice} USDC`
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                        <button onClick={() => setActiveTab('membership')} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold text-sm w-full hover:scale-105 transition-transform">
                                                                            View Plans
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null}

                                                {/* Text Content */}
                                                <div className="p-6">
                                                    <h3 className="font-bold text-xl text-slate-900 mb-2">{post.title}</h3>
                                                    <p className={`text-slate-600 leading-relaxed ${locked ? 'blur-sm select-none' : ''}`}>
                                                        {locked
                                                            ? "This is a preview of the content suitable only for members. Join now to read the full story and access exclusive updates."
                                                            : (expandedPosts[i] || !post.content || post.content.length < 200 ? post.content : post.content.substring(0, 200) + '...')}
                                                    </p>
                                                    {!locked && post.content && post.content.length >= 200 && (
                                                        <button onClick={() => toggleExpand(i)} className="text-primary text-sm font-bold mt-2">
                                                            {expandedPosts[i] ? 'Read Less' : 'Read More'}
                                                        </button>
                                                    )}

                                                    {/* Unlock buttons for LOCKED text-only posts (no image) */}
                                                    {locked && !post.image && (
                                                        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
                                                            {post.ppvRequired && post.ppvPrice && (
                                                                <button
                                                                    onClick={() => handlePPVPurchase(post)}
                                                                    disabled={purchasingPostId === post.id}
                                                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-bold text-sm w-full hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                                                                >
                                                                    {purchasingPostId === post.id ? (
                                                                        <>
                                                                            <Loader2 size={16} className="animate-spin" />
                                                                            Processing...
                                                                        </>
                                                                    ) : (
                                                                        <>⚡ Unlock for ${post.ppvPrice} USDC</>
                                                                    )}
                                                                </button>
                                                            )}
                                                            <button onClick={() => setActiveTab('membership')} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold text-sm w-full hover:scale-[1.02] transition-transform">
                                                                View Membership Plans
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="mt-6 flex items-center gap-6 pt-6 border-t border-slate-50">
                                                        <button
                                                            onClick={() => handleLike(post.id, i)}
                                                            className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors group"
                                                        >
                                                            <Heart size={20} className="group-hover:fill-current" />
                                                            <span className="text-xs font-bold">{post.likes || 0}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openComments(post)}
                                                            className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                                                        >
                                                            <MessageCircle size={20} />
                                                            <span className="text-xs font-bold">{postComments.filter(c => c.postId === post.id).length || 0}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        )
                    }

                    {/* MEMBERSHIP TAB */}
                    {
                        activeTab === 'membership' && (
                            <div className="space-y-8">
                                <div className="text-center max-w-lg mx-auto mb-10">
                                    <h2 className="font-serif text-3xl font-bold text-slate-900 mb-3">Support {displayName}</h2>
                                    <p className="text-slate-500">Choose a membership level to unlock exclusive content and join the community.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {creatorTiers.map((tier, i) => (
                                        <div key={i} className="bg-white rounded-[2rem] p-8 shadow-xl shadow-primary/5 border border-primary/10 relative overflow-hidden group hover:border-primary/30 transition-all">
                                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>

                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 relative">
                                                <div>
                                                    <h3 className="font-serif text-2xl font-bold text-slate-900">{tier.name}</h3>
                                                    <p className="text-slate-500 font-medium mt-1">Monthly Support</p>
                                                </div>
                                                <div className="bg-mist border border-slate-100 px-4 py-2 rounded-xl text-primary font-bold text-xl">
                                                    {formatPrice(tier.price)}<span className="text-sm text-slate-400 font-normal">/mo</span>
                                                </div>
                                            </div>

                                            <ul className="space-y-4 mb-8 relative">
                                                <li className="flex items-center gap-3 text-slate-700 font-medium">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                                    <span>Directly support {displayName}</span>
                                                </li>
                                                {tier.benefits?.map((b: string, idx: number) => (
                                                    <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                                        <span>{b}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {activeSubscription?.tierId === tier.id ? (
                                                <button
                                                    disabled
                                                    className="w-full py-4 rounded-full bg-emerald-100 text-emerald-600 font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <Check size={20} />
                                                    Current Plan
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSubscribeClick(i)}
                                                    className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-fuchsia-accent text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                                >
                                                    Join {tier.name}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {creatorTiers.length === 0 && (
                                        <div className="text-center p-8 bg-slate-50 rounded-3xl text-slate-400">No public tiers available yet.</div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {/* ABOUT TAB */}
                    {
                        activeTab === 'about' && (
                            <div className="bg-white rounded-[2rem] p-10 border border-slate-100">
                                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-6">About {displayName}</h3>
                                <div className="prose prose-slate lg:prose-lg">
                                    <p className="leading-relaxed text-slate-600">
                                        {creatorProfile?.description || "This creator hasn't added a bio yet."}
                                    </p>
                                </div>
                            </div>
                        )
                    }
                </div>

                {/* Right Column: Sticky Sidebar (Desktop) */}
                <aside className="hidden lg:block space-y-8 sticky top-24">

                    {/* Subscription Status / Creator Stats */}
                    {activeSubscription ? (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Active Member</p>
                                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Subscribed</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {activeSubscription.tierName && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Tier</span>
                                        <span className="font-bold text-slate-900">{activeSubscription.tierName}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Expires</span>
                                    <span className="font-bold text-slate-900">
                                        {new Date(activeSubscription.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-indigo-100">
                                <p className="text-xs text-indigo-600 font-medium text-center">✨ You have full access to all content</p>
                            </div>
                        </div>
                    ) : address && creatorProfile?.address?.toLowerCase() !== address?.toLowerCase() ? (
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Lock size={24} />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-1">Become a Member</h4>
                                <p className="text-xs text-slate-500 mb-4">Unlock exclusive content and support {displayName}</p>
                                <button
                                    onClick={() => setActiveTab('membership')}
                                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
                                >
                                    View Plans
                                </button>
                            </div>
                        </div>
                    ) : address && creatorProfile?.address?.toLowerCase() === address?.toLowerCase() ? (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Your Stats</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500 font-medium">Members</span>
                                    <span className="text-lg font-bold text-slate-900">{realMemberCount}</span>
                                </div>
                                <div className="h-px bg-slate-200/60" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500 font-medium">Posts</span>
                                    <span className="text-lg font-bold text-slate-900">{posts.length}</span>
                                </div>
                                <div className="h-px bg-slate-200/60" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500 font-medium">Tiers</span>
                                    <span className="text-lg font-bold text-slate-900">{creatorTiers.length}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="mt-5 w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    ) : null}

                    {/* Leaderboard - only show wrapper if component renders content */}
                    <SupporterLeaderboard creatorAddress={creatorId} />

                    {/* Commission Request Card - visible to supporters (not the creator themselves) */}
                    {address && creatorProfile?.address?.toLowerCase() !== address?.toLowerCase() && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            {!showCommissionForm ? (
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4 text-indigo-500">
                                        <MessageSquarePlus size={24} />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-1">Request Custom Content</h4>
                                    <p className="text-xs text-slate-500 mb-4">Pay {displayName} USDC to create something just for you</p>
                                    <button
                                        onClick={() => setShowCommissionForm(true)}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200/50"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <MessageSquarePlus size={16} />
                                            Request Content
                                        </span>
                                    </button>
                                </div>
                            ) : commissionSuccess ? (
                                <div className="text-center py-4">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-500">
                                        <CheckCircle size={28} />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-1">Request Sent!</h4>
                                    <p className="text-xs text-slate-500">{displayName} will see your commission request.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                            <MessageSquarePlus size={16} className="text-indigo-500" />
                                            Request from {displayName}
                                        </h4>
                                        <button
                                            onClick={() => setShowCommissionForm(false)}
                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                What would you like {displayName} to create?
                                            </label>
                                            <input
                                                type="text"
                                                value={commissionTitle}
                                                onChange={(e) => setCommissionTitle(e.target.value)}
                                                placeholder="e.g. A personalized video shoutout"
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                Details (optional)
                                            </label>
                                            <textarea
                                                value={commissionDescription}
                                                onChange={(e) => setCommissionDescription(e.target.value)}
                                                placeholder="Describe what you want in detail..."
                                                rows={3}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-vertical"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                Budget (USDC)
                                            </label>
                                            <div className="flex gap-2 mb-2">
                                                {['5', '10', '25', '50'].map((preset) => (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => setCommissionBudget(preset)}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                                            commissionBudget === preset
                                                                ? 'bg-indigo-500 text-white shadow-md'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        ${preset}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="number"
                                                    value={commissionBudget}
                                                    onChange={(e) => setCommissionBudget(e.target.value)}
                                                    placeholder="Custom amount"
                                                    min="1"
                                                    step="any"
                                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCommissionSubmit}
                                            disabled={isSubmittingCommission || !commissionTitle || !commissionBudget}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200/50"
                                        >
                                            {isSubmittingCommission ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Send size={16} />
                                            )}
                                            {isSubmittingCommission ? 'Sending...' : `Send Request (${commissionBudget || '0'} USDC)`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* Mobile: Bottom Tip Jar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-50 shadow-2xl">
                    <TipJar receiverAddress={creatorId} />
                </div>
            </main>

            <CheckoutModal
                isOpen={checkoutModalOpen}
                onClose={() => setCheckoutModalOpen(false)}
                onConfirm={handleConfirmSubscribe}
                tier={selectedTierIndex !== null ? creatorTiers[selectedTierIndex] : null}
                status={checkoutStatus}
                txHash={paymentTxHash || undefined}
            />

            {/* Comment Modal */}
            {commentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCommentModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-serif text-xl font-bold text-slate-900">Comments</h3>
                            <button onClick={() => setCommentModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                            {postComments.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <MessageCircle size={32} />
                                    </div>
                                    <p className="text-slate-400 font-medium">No comments yet. Be the first to reply!</p>
                                </div>
                            ) : (
                                postComments.map((comment, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden">
                                            {comment.avatarUrl ? (
                                                <img src={comment.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200">
                                                    <User size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-sm font-bold text-slate-900 mb-1">{comment.username || 'User'}</p>
                                                <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 ml-2 font-medium">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <div className="relative">
                                <textarea
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-16 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[100px]"
                                />
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={isCommenting || !commentContent.trim()}
                                    className="absolute bottom-4 right-4 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                                >
                                    {isCommenting ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} className="fill-current" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
