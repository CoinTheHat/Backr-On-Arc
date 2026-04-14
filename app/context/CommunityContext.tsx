'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAccount } from 'wagmi';

// Types
export interface Post {
    id: string;
    author: string;
    content: string;
    timestamp: string;
    likes: number;
    tier: string;
}

export interface Tier {
    id: string;
    name: string;
    price: string;
    perks: string[];
}

interface Stats {
    totalBackrs: number;
    activeDiscussions: number;
    likesThisWeek: number;
    topTierMembers: number;
}

interface CommunityContextType {
    posts: Post[];
    tiers: Tier[];
    stats: Stats;
    isDeployed: boolean;
    contractAddress: string | null;
    isLoading: boolean;
    refreshData: () => void;
    addPost: (content: string, tier: string) => void;
    addTier: (tier: Omit<Tier, 'id'>) => void;
    deleteTier: (id: string) => void;
    address: string | undefined; // Exposed for convenience
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: ReactNode }) {
    const { address, isConnected } = useAccount();

    const [posts, setPosts] = useState<Post[]>([]);
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [isDeployed, setIsDeployed] = useState(false);
    const [contractAddress, setContractAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [stats, setStats] = useState<Stats>({
        totalBackrs: 0,
        activeDiscussions: 0,
        likesThisWeek: 0,
        topTierMembers: 0
    });

    const refreshData = () => {
        if (address) {
            setIsLoading(true);

            // 1. Fetch Stats
            fetch(`/api/stats?creator=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        if (data.checklist) setIsDeployed(!!data.checklist.isDeployed);
                        setContractAddress(data.contractAddress || null);

                        // Update Stats State
                        setStats({
                            totalBackrs: data.totalBackrs || 0,
                            activeDiscussions: data.activeDiscussions || 0,
                            likesThisWeek: data.likesThisWeek || 0,
                            topTierMembers: data.topTierMembers || 0
                        });
                    }
                })
                .catch(err => console.error(err));

            // 2. Fetch Posts
            fetch(`/api/posts?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setPosts(data.map((p: any) => ({
                            id: p.id,
                            author: 'You', // In dashboard, it's always you
                            content: p.content,
                            timestamp: new Date(p.createdAt).toLocaleDateString(),
                            likes: p.likes || 0,
                            tier: `Tier ${p.minTier || 1}`
                        })));
                    }
                })
                .catch(err => console.error(err));

            // 3. Fetch Tiers
            fetch(`/api/tiers?creator=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setTiers(data.map((t: any) => ({
                            id: t.id || t.tierId,
                            name: t.name,
                            price: t.price,
                            perks: t.perks || []
                        })));
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setIsLoading(false);
                });
        }
    };

    useEffect(() => {
        if (isConnected && address) {
            refreshData();
        } else {
            // Reset data if logged out
            setPosts([]);
            setTiers([]);
            setIsDeployed(false);
            setIsLoading(false);
        }
    }, [isConnected, address]);

    const addPost = (content: string, tier: string) => {
        // Optimistic update - ideally should call API
        const newPost: Post = {
            id: Date.now().toString(),
            author: 'You',
            content,
            timestamp: 'Just now',
            likes: 0,
            tier
        };
        setPosts([newPost, ...posts]);
        setStats(prev => ({ ...prev, activeDiscussions: prev.activeDiscussions + 1 }));
    };

    const addTier = (tierData: Omit<Tier, 'id'>) => {
        // Optimistic update
        const newTier: Tier = {
            ...tierData,
            id: Date.now().toString()
        };
        setTiers([...tiers, newTier]);
    };

    const deleteTier = (id: string) => {
        setTiers(tiers.filter(t => t.id !== id));
    };

    return (
        <CommunityContext.Provider value={{
            posts,
            tiers,
            stats,
            isDeployed,
            contractAddress,
            isLoading,
            addPost,
            addTier,
            deleteTier,
            refreshData,
            address
        }}>
            {children}
        </CommunityContext.Provider>
    );
}

export function useCommunity() {
    const context = useContext(CommunityContext);
    if (context === undefined) {
        throw new Error('useCommunity must be used within a CommunityProvider');
    }
    return context;
}
