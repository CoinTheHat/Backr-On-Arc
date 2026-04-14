'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Button from '../../components/Button';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import Input from '../../components/Input';
import ImageUpload from '../../components/ImageUpload';
import { useToast } from '../../components/Toast';
import { useCommunity } from '../../context/CommunityContext';
import DiscoverySettings from './components/DiscoverySettings';

import { Copy, ExternalLink, Save, RefreshCw, Trash2, Info, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettingsPage() {
    const { address } = useAccount();
    const { addToast } = useToast();
    const { isDeployed, contractAddress, refreshData } = useCommunity();

    // Form State
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [email, setEmail] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initial Data Load
    useEffect(() => {
        if (address) {
            setIsLoading(true);
            const fetchData = async () => {
                try {
                    const res = await fetch(`/api/creators?address=${address}`);
                    const data = await res.json();
                    if (data && data.address) {
                        setUsername(data.username || '');
                        setName(data.name || '');
                        setAvatarUrl(data.avatarUrl || data.profileImage || '');
                        setBio(data.bio || '');
                        setCoverImage(data.coverImage || '');
                        setEmail(data.email || '');
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [address]);

    const handleSave = async () => {
        console.log("handleSave called");
        if (!address) {
            alert("No wallet connected");
            return;
        }
        if (!name) {
            alert("Name is required");
            return addToast("Name is required", 'error');
        }
        if (!username) {
            alert("Username is required");
            return addToast("Username is required", 'error');
        }
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            alert("Username must be 3-20 characters, letters, numbers, and underscores only");
            return addToast("Username must be 3-20 characters, letters, numbers, and underscores only", 'error');
        }

        setIsSaving(true);
        try {
            console.log("Sending data to API:", { address, username, name, bio, avatarUrl, coverImage, email });
            // Save to JSON/Supabase via API
            const res = await fetch('/api/creators', {
                method: 'POST', // or PUT
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    username,
                    name,
                    bio,
                    avatarUrl,
                    coverImage,
                    email
                })
            });

            console.log("API Response:", res.status);
            if (res.ok) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                addToast("Kayıt Başarılı / Saved Successfully!", 'success');
                if (refreshData) refreshData();
            } else {
                const err = await res.json();
                console.error("API Error:", err);
                alert("Failed to update profile: " + (err.error || 'Unknown error'));
                addToast("Failed to update profile", 'error');
            }
        } catch (e: any) {
            console.error("Save Error:", e);
            alert("Error saving profile: " + e.message);
            addToast("Error saving profile", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            addToast("Address copied!", 'success');
        }
    };

    if (isLoading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <SectionHeader
                title="Settings"
                description="Manage your profile and wallet settings."
            />

            {/* Profile Settings */}
            <Card className="p-0 overflow-hidden border border-white/5">
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Save size={18} className="text-brand-primary" />
                        Profile Details
                    </h3>
                </div>
                <div className="space-y-10">
                    {/* PROFILE HEADER AREA (SOCIAL STYLE) */}
                    <div className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
                        <div className="relative mb-20">
                            {/* Cover Image */}
                            <ImageUpload
                                bucket="avatars"
                                value={coverImage}
                                onChange={setCoverImage}
                                aspectRatio="video"
                                showLabel={false}
                                className="w-full"
                                label="Cover Image"
                                helperText="1500x500px"
                            />

                            {/* Overlapping Avatar */}
                            <div className="absolute -bottom-16 left-10 z-20">
                                <ImageUpload
                                    bucket="avatars"
                                    value={avatarUrl}
                                    onChange={setAvatarUrl}
                                    aspectRatio="square"
                                    showLabel={false}
                                    className="w-40 h-40 rounded-full border-8 border-white shadow-2xl overflow-hidden bg-white"
                                    label="Avatar"
                                    helperText="PP"
                                />
                            </div>
                        </div>

                        <div className="p-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="Username"
                                placeholder="username"
                                value={username}
                                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                helperText="3-20 characters, letters, numbers, and underscores only. This will be your unique profile URL."
                                containerStyle={{ gridColumn: 'span 2' }}
                            />
                            <Input
                                label="Display Name"
                                placeholder="Your Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                            <Input
                                label="Email (Optional)"
                                placeholder="contact@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <Input
                            label="Bio"
                            textarea
                            placeholder="Tell your fans about yourself..."
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            containerStyle={{ gridColumn: 'span 2' }}
                        />
                    </div>
                </div>

                {/* STICKY SAVE BAR */}
                <div className="mt-12 flex items-center justify-between p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                    <div className="flex items-center gap-3 text-indigo-900/60">
                        <Info size={20} />
                        <p className="text-sm font-medium">Your profile is visible to all supporters.</p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-4 bg-[#0f172a] text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-200"
                    >
                        {isSaving ? <RefreshCw className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        Save All Changes
                    </Button>
                </div>
            </Card>

            {/* Discovery Settings (Categories & Hashtags) */}
            {address && <DiscoverySettings address={address} />}

            {/* Wallet Settings - Simplified for Hackathon */}
            <Card className="p-0 overflow-hidden border border-white/5">
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Wallet size={18} className="text-brand-accent" />
                        Wallet & Payments
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                                <Wallet size={20} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Connected Wallet (Arc Testnet)</div>
                                <div className="font-mono font-medium">{address}</div>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={copyAddress}>
                            <Copy size={16} />
                        </Button>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-3">
                            <Info size={20} className="text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-bold text-blue-400 mb-1">Arc Testnet Funds</h4>
                                <p className="text-sm text-gray-300 mb-3">
                                    You need USDC on Arc Testnet to test tipping, subscriptions, and pay-per-view features. Arc uses USDC as its native gas token.
                                </p>
                                <a
                                    href="https://faucet.circle.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
                                >
                                    Get USDC from Circle Faucet <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
