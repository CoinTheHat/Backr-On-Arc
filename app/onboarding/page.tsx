'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useWalletClient } from 'wagmi';
import { Rocket, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { SUBSCRIPTION_FACTORY_ADDRESS, TOKENS, ARC_EXPLORER_URL } from '@/app/utils/constants';
import { SUBSCRIPTION_FACTORY_ABI } from '@/app/utils/abis';
import type { Address } from 'viem';

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>}>
            <OnboardingContent />
        </Suspense>
    );
}

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const deployOnly = searchParams.get('deploy') === 'true';
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const { addToast } = useToast();

    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'profile' | 'deploying' | 'done'>(deployOnly ? 'profile' : 'profile');
    const [contractAddress, setContractAddress] = useState<string | null>(null);

    // For deploy-only mode, load existing profile data
    useEffect(() => {
        if (deployOnly && address) {
            fetch(`/api/creators?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data?.name) {
                        setName(data.name);
                        setUsername(data.username || '');
                        setBio(data.bio || '');
                    }
                })
                .catch(() => {});
        }
    }, [deployOnly, address]);

    const deployContractOnChain = async () => {
        if (!walletClient || !address) throw new Error('Wallet not connected');

        setStep('deploying');
        addToast('Deploying your creator contract on Arc...', 'info');

        const txHash = await walletClient.writeContract({
            address: SUBSCRIPTION_FACTORY_ADDRESS as Address,
            abi: SUBSCRIPTION_FACTORY_ABI,
            functionName: 'createProfile',
            args: [TOKENS.USDC as Address],
        });

        console.log('[onboarding] Deploy tx:', txHash);

        // Wait for tx confirmation using publicClient
        const { createPublicClient, http } = await import('viem');
        const { arcTestnet } = await import('@/utils/arc-config');
        const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

        // Poll for receipt (Arc has sub-second finality but let's be safe)
        for (let i = 0; i < 10; i++) {
            try {
                const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
                if (receipt && receipt.status === 'success') {
                    console.log('[onboarding] Tx confirmed:', receipt);
                    break;
                }
            } catch {
                // Not yet mined
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Get the deployed contract address
        let deployedContract = '';
        try {
            deployedContract = await publicClient.readContract({
                address: SUBSCRIPTION_FACTORY_ADDRESS as Address,
                abi: SUBSCRIPTION_FACTORY_ABI,
                functionName: 'getProfile',
                args: [address],
            }) as string;
            console.log('[onboarding] Contract address:', deployedContract);
        } catch (err) {
            console.warn('Could not read contract address:', err);
        }

        return deployedContract;
    };

    const handleDeploy = async () => {
        if (!address) return addToast('Please connect your wallet', 'error');
        if (!walletClient) return addToast('Wallet client not ready. Please wait a moment and try again.', 'error');
        setLoading(true);
        try {
            const deployedContract = await deployContractOnChain();
            setContractAddress(deployedContract || null);

            // Update existing profile with contract address
            await fetch('/api/creators', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    username: username || '',
                    name: name || '',
                    email: '',
                    bio: bio || '',
                    profileImage: '',
                    coverImage: '',
                    contractAddress: deployedContract || '',
                })
            });

            setStep('done');
            addToast('Contract deployed on Arc!', 'success');
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || 'Failed to deploy contract', 'error');
            setStep('profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return addToast('Please enter a display name', 'error');
        if (!username.trim()) return addToast('Please enter a username', 'error');
        if (!walletClient || !address) return addToast('Please connect your wallet', 'error');

        setLoading(true);
        try {
            const deployedContract = await deployContractOnChain();
            setContractAddress(deployedContract || null);

            // Save profile to database
            const res = await fetch('/api/creators', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    username: username.trim().toLowerCase(),
                    name: name.trim(),
                    email: '',
                    bio: bio.trim(),
                    profileImage: '',
                    coverImage: '',
                    contractAddress: deployedContract || '',
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create profile');

            setStep('done');
            addToast('Creator profile deployed on Arc!', 'success');
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || 'Failed to deploy contract', 'error');
            setStep('profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mist flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => router.push('/')}
                    className="text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors"
                >
                    Cancel
                </button>
            </div>

            <div className="mb-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                    <Rocket size={32} />
                </div>
                <h1 className="text-3xl font-bold font-serif text-slate-900">
                    {step === 'done' ? 'You\'re All Set!' : deployOnly ? 'Deploy Your Contract' : 'Become a Creator'}
                </h1>
                <p className="text-slate-500 text-center max-w-sm">
                    {step === 'profile' && (deployOnly
                        ? 'Your profile exists but needs a subscription contract on Arc Network.'
                        : 'Set up your profile and deploy your creator contract on Arc Network.')}
                    {step === 'deploying' && 'Deploying your subscription contract on Arc Testnet...'}
                    {step === 'done' && 'Your creator contract is live on Arc. Start creating!'}
                </p>
            </div>

            {step === 'deploying' && (
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-white text-center">
                    <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-900 mb-2">Deploying Contract...</p>
                    <p className="text-sm text-slate-500">Confirm the transaction in your wallet. This creates your personal subscription contract with 5% platform fee built-in.</p>
                </div>
            )}

            {step === 'done' && (
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-white text-center">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-900 mb-2">Contract Deployed!</p>
                    {contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000' && (
                        <a
                            href={`${ARC_EXPLORER_URL}/address/${contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:underline break-all"
                        >
                            {contractAddress}
                        </a>
                    )}
                    <p className="text-sm text-slate-500 mt-3">Redirecting to dashboard...</p>
                </div>
            )}

            {step === 'profile' && deployOnly && (
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-white text-center">
                    <p className="text-slate-600 mb-4">Hi <strong>{name || 'Creator'}</strong>, you need to deploy a subscription contract on Arc to receive payments.</p>
                    <div className="bg-indigo-50 rounded-xl p-4 text-sm mb-6 text-left">
                        <p className="font-bold text-indigo-800 mb-1">What this does:</p>
                        <ul className="text-indigo-600 space-y-1">
                            <li>- Deploys your personal subscription contract on Arc</li>
                            <li>- Enables supporters to subscribe and tip you in USDC</li>
                            <li>- 5% platform fee on withdrawals, 95% goes to you</li>
                        </ul>
                    </div>
                    <button
                        onClick={handleDeploy}
                        disabled={loading || (mounted && !address)}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <>Deploy Contract on Arc <ArrowRight size={20} /></>}
                    </button>
                </div>
            )}

            {step === 'profile' && !deployOnly && (
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-white">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (!username && e.target.value) {
                                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                                    }
                                }}
                                placeholder="e.g. Luna Nova"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400 font-medium">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="lunanova"
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Unique handle for your profile URL.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Bio (Optional)</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell your fans what you create..."
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none"
                            />
                        </div>

                        <div className="bg-indigo-50 rounded-xl p-4 text-sm">
                            <p className="font-bold text-indigo-800 mb-1">What happens next:</p>
                            <ul className="text-indigo-600 space-y-1">
                                <li>1. Your wallet signs a transaction on Arc Testnet</li>
                                <li>2. A subscription contract is deployed for you</li>
                                <li>3. Supporters can subscribe and tip via USDC</li>
                                <li>4. 5% platform fee on withdrawals, 95% goes to you</li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !name || !username || (mounted && !address)}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <>Deploy & Create Profile <ArrowRight size={20} /></>}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
