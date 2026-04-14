'use client';

import { LucideUsers, LucideMessageCircle, LucideHeart, LucideAward } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useRouter } from 'next/navigation';
import Button from '../components/Button';

export default function CommunityPage() {
    const { stats, posts, tiers } = useCommunity();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-brand-light pt-8 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-2">My Community</h1>
                        <p className="text-brand-muted font-medium">Manage your memberships and interact with your Backrs.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/community/manage-tiers')}
                            className="bg-white border-gray-200 hover:border-brand-primary text-gray-700"
                        >
                            Manage Tiers
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => router.push('/community/new-post')}
                            className="shadow-lg shadow-brand-primary/20"
                        >
                            New Post
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Backrs', value: stats.totalBackrs, icon: LucideUsers, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
                        { label: 'Active Discussions', value: stats.activeDiscussions, icon: LucideMessageCircle, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
                        { label: 'Likes this week', value: stats.likesThisWeek, icon: LucideHeart, color: 'text-pink-500', bg: 'bg-pink-100' },
                        { label: 'Top Tier Members', value: stats.topTierMembers, icon: LucideAward, color: 'text-amber-500', bg: 'bg-amber-100' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-studio shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={20} />
                                </div>
                                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Active</span>
                            </div>
                            <div className="text-2xl font-bold text-brand-dark">{stat.value}</div>
                            <div className="text-sm text-brand-muted">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-brand-dark mb-4">Recent Activity</h2>

                        {posts.length === 0 ? (
                            <div className="bg-white p-8 rounded-studio border border-gray-100 text-center py-16 shadow-studio">
                                <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
                                    <LucideMessageCircle className="text-brand-muted" />
                                </div>
                                <h3 className="text-lg font-bold text-brand-dark">No recent activity</h3>
                                <p className="text-brand-muted text-sm">When you post content, comments and likes will appear here.</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div key={post.id} className="bg-white p-6 rounded-studio border border-gray-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-secondary to-brand-primary flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-brand-dark">{post.author}</span>
                                            <span className="text-xs text-brand-muted">{post.timestamp}</span>
                                            <span className="text-xs border border-brand-primary/30 text-brand-primary px-2 rounded-full bg-brand-primary/5">{post.tier}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap leading-relaxed">
                                            {post.content}
                                        </p>
                                        <div className="flex gap-4 text-xs text-gray-400 font-medium">
                                            <button className="hover:text-brand-primary transition-colors">Reply</button>
                                            <button className="hover:text-brand-primary transition-colors">Like {post.likes > 0 && `(${post.likes})`}</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-brand-dark mb-4">Membership Tiers</h2>
                        <div className="space-y-4">
                            {tiers.map((tier, i) => (
                                <div key={tier.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group cursor-pointer hover:border-brand-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center text-xs font-bold text-brand-secondary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-brand-dark">{tier.name}</div>
                                            <div className="text-xs text-brand-primary font-bold">{tier.price}</div>
                                        </div>
                                    </div>
                                    <span className="text-gray-400 text-sm group-hover:text-brand-primary transition-colors">View</span>
                                </div>
                            ))}
                            <button
                                onClick={() => router.push('/community/manage-tiers')}
                                className="w-full py-3 mt-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-primary/50 hover:text-brand-primary hover:bg-brand-primary/5 transition-all text-sm font-bold"
                            >
                                + Add New Tier
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
