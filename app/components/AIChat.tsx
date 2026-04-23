'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWalletClient } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { MessageCircle, X, Send, Loader2, Bot, User, ArrowRight, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { SUBSCRIPTION_CONTRACT_ABI, TIP20_ABI, ERC8183_ABI } from '@/app/utils/abis';
import { TOKENS, ARC_EXPLORER_URL, ERC8183_CONTRACT_ADDRESS } from '@/app/utils/constants';
import { useNanopay } from '@/app/hooks/useNanopay';
import { useCommunity } from '@/app/context/CommunityContext';

interface NavAction {
    label: string;
    path: string;
}

interface ExecAction {
    type: 'create_tier' | 'deposit_gateway' | 'withdraw_gateway' | 'send_tip' | 'subscribe_tier' | 'withdraw_earnings' | 'create_post' | 'create_commission' | 'request_commission' | 'unlock_ppv' | 'navigate';
    params: any;
    status: 'pending' | 'running' | 'done' | 'error';
    txHash?: string;
    message?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    navActions?: NavAction[];
    execActions?: ExecAction[];
}

// Parse AI response for [ACTION:...] and [EXECUTE:...] patterns
function parseAIResponse(text: string): { cleanText: string; navActions: NavAction[]; execActions: ExecAction[] } {
    const navActions: NavAction[] = [];
    const execActions: ExecAction[] = [];

    let cleanText = text;

    // Parse [ACTION:label|path] - navigation
    cleanText = cleanText.replace(/\[ACTION:([^|]+)\|([^\]]+)\]/g, (_, label, path) => {
        navActions.push({ label: label.trim(), path: path.trim() });
        return '';
    });

    // Parse [EXECUTE:action_type|params_json] - on-chain actions
    cleanText = cleanText.replace(/\[EXECUTE:([^|]+)\|([^\]]+)\]/g, (_, type, paramsStr) => {
        try {
            const params = JSON.parse(paramsStr);
            execActions.push({ type: type.trim() as any, params, status: 'pending' });
        } catch (e) {
            console.warn('Failed to parse exec action:', paramsStr);
        }
        return '';
    });

    return { cleanText: cleanText.trim(), navActions, execActions };
}

export default function AIChat() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { data: walletClient, refetch: refetchWalletClient } = useWalletClient();
    const { contractAddress } = useCommunity();
    const { deposit: depositToGateway, withdraw: withdrawFromGateway } = useNanopay();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hey! I\'m your Backr agent. I can navigate, explain features, and execute on-chain actions for you — create tiers, deposit to Gateway, send tips, all automatically. What do you want to do?',
            navActions: [
                { label: 'Create a Post', path: '/community/new-post' },
                { label: 'Manage Tiers', path: '/dashboard/membership' },
                { label: 'View Dashboard', path: '/dashboard' },
            ]
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleNavAction = (action: NavAction) => {
        router.push(action.path);
        setIsOpen(false);
    };

    // Execute an on-chain action
    const executeAction = async (action: ExecAction, msgIndex: number, actionIndex: number): Promise<void> => {
        const updateStatus = (updates: Partial<ExecAction>) => {
            setMessages(prev => {
                const copy = [...prev];
                const msg = { ...copy[msgIndex] };
                const actions = msg.execActions ? [...msg.execActions] : [];
                actions[actionIndex] = { ...actions[actionIndex], ...updates };
                msg.execActions = actions;
                copy[msgIndex] = msg;
                return copy;
            });
        };

        updateStatus({ status: 'running' });

        try {
            // Wait for walletClient with retries (can be undefined briefly after connect)
            type WC = NonNullable<typeof walletClient>;
            let wc: WC | undefined = walletClient;
            if (!wc) {
                for (let i = 0; i < 5; i++) {
                    await new Promise(r => setTimeout(r, 300));
                    const refreshed = await refetchWalletClient();
                    if (refreshed.data) {
                        wc = refreshed.data;
                        break;
                    }
                }
            }

            if (!isConnected || !address) {
                throw new Error('Wallet not connected. Please click Connect Wallet.');
            }
            if (!wc) {
                throw new Error('Wallet client not ready. Please refresh the page and try again.');
            }
            const activeWc: WC = wc;

            if (action.type === 'create_tier') {
                if (!contractAddress) throw new Error('Deploy your contract first');
                const { name, price } = action.params;
                if (!name || !price) throw new Error('Missing tier name or price');

                const durationSeconds = BigInt(30 * 24 * 60 * 60);
                const txHash = await activeWc.writeContract({
                    address: contractAddress as Address,
                    abi: SUBSCRIPTION_CONTRACT_ABI,
                    functionName: 'createTier',
                    args: [name, parseUnits(String(price), 6), durationSeconds],
                });

                // Save to DB
                await fetch('/api/tiers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creator: address,
                        name,
                        price: String(price),
                        perks: action.params.perks || [],
                    }),
                });

                updateStatus({ status: 'done', txHash, message: `Tier "${name}" created at $${price}/mo` });
            }

            else if (action.type === 'deposit_gateway') {
                const { amount } = action.params;
                if (!amount) throw new Error('Missing deposit amount');

                const txHash = await depositToGateway(String(amount), (msg) => {
                    updateStatus({ status: 'running', message: msg });
                });
                updateStatus({ status: 'done', txHash: txHash as string, message: `Deposited $${amount} USDC to Gateway` });
            }

            else if (action.type === 'send_tip') {
                const { to, amount } = action.params;
                if (!to || !amount) throw new Error('Missing recipient or amount');

                const totalWei = parseUnits(String(amount), 6);
                const feeWei = (totalWei * BigInt(500)) / BigInt(10000); // 5%
                const creatorWei = totalWei - feeWei;

                // 95% to creator
                const txHash = await activeWc.writeContract({
                    address: TOKENS.USDC as Address,
                    abi: TIP20_ABI,
                    functionName: 'transfer',
                    args: [to as Address, creatorWei],
                });

                // 5% to platform treasury
                if (feeWei > BigInt(0)) {
                    const { PLATFORM_TREASURY } = await import('@/app/utils/constants');
                    await activeWc.writeContract({
                        address: TOKENS.USDC as Address,
                        abi: TIP20_ABI,
                        functionName: 'transfer',
                        args: [PLATFORM_TREASURY as Address, feeWei],
                    });
                }

                updateStatus({ status: 'done', txHash, message: `Sent $${amount} USDC to ${to.slice(0, 8)}... (5% platform fee applied)` });
            }

            else if (action.type === 'subscribe_tier') {
                const { creator, tier } = action.params;
                if (!creator || !tier) throw new Error('Missing creator or tier name');

                updateStatus({ status: 'running', message: `Looking up ${creator}...` });

                // 1. Resolve creator by username or name
                let creatorAddress: string | null = null;
                if (creator.startsWith('0x') && creator.length === 42) {
                    creatorAddress = creator;
                } else {
                    const findRes = await fetch('/api/find', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ identifier: creator })
                    });
                    const findData = await findRes.json();
                    if (!findData.success) throw new Error(`Creator "${creator}" not found`);
                    creatorAddress = findData.address;
                }

                // 2. Get creator's contract address
                const profileRes = await fetch(`/api/creators?address=${creatorAddress}`);
                const profile = await profileRes.json();
                if (!profile?.contractAddress || profile.contractAddress === '0x0000000000000000000000000000000000000000') {
                    throw new Error(`${creator} has no subscription contract deployed`);
                }

                // 3. Read on-chain tiers to find the right index
                updateStatus({ status: 'running', message: `Reading ${creator}'s tiers on-chain...` });
                const { createPublicClient, http } = await import('viem');
                const { arcTestnet } = await import('@/utils/arc-config');
                const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

                const chainTiers: any = await publicClient.readContract({
                    address: profile.contractAddress as Address,
                    abi: SUBSCRIPTION_CONTRACT_ABI,
                    functionName: 'getTiers',
                });

                if (!chainTiers || chainTiers.length === 0) {
                    throw new Error(`${creator} has no on-chain tiers yet`);
                }

                const tierIndex = chainTiers.findIndex((t: any) =>
                    t.name.toLowerCase() === tier.toLowerCase()
                );
                if (tierIndex === -1) {
                    const available = chainTiers.map((t: any) => t.name).join(', ');
                    throw new Error(`Tier "${tier}" not found. Available: ${available}`);
                }

                const chainTier = chainTiers[tierIndex];
                const price = chainTier.price as bigint;

                // 4. Approve USDC
                updateStatus({ status: 'running', message: `Approving USDC...` });
                await activeWc.writeContract({
                    address: TOKENS.USDC as Address,
                    abi: TIP20_ABI,
                    functionName: 'approve',
                    args: [profile.contractAddress as Address, price],
                });

                await new Promise(r => setTimeout(r, 2000));

                // 5. Subscribe
                updateStatus({ status: 'running', message: `Subscribing...` });
                const txHash = await activeWc.writeContract({
                    address: profile.contractAddress as Address,
                    abi: SUBSCRIPTION_CONTRACT_ABI,
                    functionName: 'subscribe',
                    args: [BigInt(tierIndex)],
                });

                // 6. Save to DB
                await fetch('/api/subscriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscriberAddress: address,
                        creatorAddress,
                        tierId: tierIndex,
                        expiry: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
                        txHash,
                    })
                });

                const priceDisplay = Number(price) / 1e6;
                updateStatus({ status: 'done', txHash, message: `Subscribed to ${creator}'s ${tier} tier ($${priceDisplay}/mo)` });
            }

            else if (action.type === 'withdraw_earnings') {
                if (!contractAddress) throw new Error('You need a creator contract to withdraw earnings');

                updateStatus({ status: 'running', message: 'Withdrawing earnings from contract...' });

                const txHash = await activeWc.writeContract({
                    address: contractAddress as Address,
                    abi: SUBSCRIPTION_CONTRACT_ABI,
                    functionName: 'withdraw',
                    args: [],
                });

                updateStatus({ status: 'done', txHash, message: 'Earnings withdrawn (5% platform fee applied)' });
            }

            else if (action.type === 'withdraw_gateway') {
                const { amount } = action.params;
                if (!amount) throw new Error('Missing amount');

                updateStatus({ status: 'running', message: `Withdrawing $${amount} from Gateway...` });

                const txHash = await withdrawFromGateway(String(amount));
                updateStatus({ status: 'done', txHash: txHash as string, message: `Initiated withdrawal of $${amount} USDC to your wallet` });
            }

            else if (action.type === 'create_post') {
                if (!contractAddress) throw new Error('Only creators can post. Deploy your contract first.');
                const { title, content, ppvPrice, isPublic } = action.params;
                if (!title || !content) throw new Error('Missing title or content');

                updateStatus({ status: 'running', message: 'Creating post...' });

                const res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creatorAddress: address,
                        title,
                        content,
                        minTier: isPublic === false || ppvPrice ? 1 : 0,
                        isPublic: isPublic !== false && !ppvPrice,
                        ppvEnabled: !!ppvPrice,
                        ppvPrice: ppvPrice ? String(ppvPrice) : null,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to create post');
                }

                const postType = ppvPrice ? `PPV ($${ppvPrice})` : isPublic === false ? 'Members-only' : 'Public';
                updateStatus({ status: 'done', message: `${postType} post "${title}" published` });
            }

            else if (action.type === 'create_commission') {
                if (!contractAddress) throw new Error('Only creators can create commissions');
                const { title, description, budget } = action.params;
                if (!title || !budget) throw new Error('Missing title or budget');

                updateStatus({ status: 'running', message: 'Creating on-chain commission...' });

                // Create job on ERC-8183 contract
                const budgetWei = parseUnits(String(budget), 6);
                const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // 7 days
                const zeroAddr = '0x0000000000000000000000000000000000000000' as Address;

                const txHash = await activeWc.writeContract({
                    address: ERC8183_CONTRACT_ADDRESS as Address,
                    abi: ERC8183_ABI,
                    functionName: 'createJob',
                    args: [zeroAddr, zeroAddr, expiredAt, description || title, zeroAddr],
                });

                // Save to DB
                await fetch('/api/jobs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creatorAddress: address,
                        title,
                        description: description || '',
                        budget: String(budget),
                        txHash,
                    }),
                });

                updateStatus({ status: 'done', txHash, message: `Commission "${title}" posted with $${budget} budget` });
            }

            else if (action.type === 'unlock_ppv') {
                const { postId, amount, creatorAddress: postCreatorAddr } = action.params;
                if (!postId || !amount) throw new Error('Missing postId or amount');

                updateStatus({ status: 'running', message: 'Unlocking post...' });

                // Resolve creator address if not provided
                let toAddress = postCreatorAddr;
                if (!toAddress) {
                    const postRes = await fetch(`/api/posts/${postId}`);
                    const postData = await postRes.json();
                    toAddress = postData?.creatorAddress;
                }
                if (!toAddress) throw new Error('Could not find post creator');

                // Send USDC directly (useSend equivalent)
                const txHash = await activeWc.writeContract({
                    address: TOKENS.USDC as Address,
                    abi: TIP20_ABI,
                    functionName: 'transfer',
                    args: [toAddress as Address, parseUnits(String(amount), 6)],
                });

                // Record purchase
                await fetch(`/api/posts/${postId}/purchase`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ buyerAddress: address, txHash }),
                });

                updateStatus({ status: 'done', txHash, message: `Post unlocked for $${amount}` });
            }

            else if (action.type === 'request_commission') {
                const { creator, title, description, budget } = action.params;
                if (!creator || !title || !budget) throw new Error('Missing creator, title, or budget');

                updateStatus({ status: 'running', message: `Looking up ${creator}...` });

                // Resolve creator address
                let creatorAddress: string | null = null;
                if (creator.startsWith('0x') && creator.length === 42) {
                    creatorAddress = creator;
                } else {
                    const findRes = await fetch('/api/find', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ identifier: creator })
                    });
                    const findData = await findRes.json();
                    if (!findData.success) throw new Error(`Creator "${creator}" not found`);
                    creatorAddress = findData.address;
                }

                updateStatus({ status: 'running', message: 'Submitting commission request...' });

                const res = await fetch('/api/jobs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requesterAddress: address,
                        creatorAddress,
                        title,
                        description: description || '',
                        budget: String(budget),
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to submit commission');
                }

                updateStatus({ status: 'done', message: `Commission "${ title}" sent to ${creator} ($${budget} USDC budget)` });
            }

            else {
                throw new Error(`Unknown action type: ${action.type}`);
            }
        } catch (err: any) {
            console.error('[AIChat] Execute error:', err);
            const errMsg = err.message?.includes('User rejected') ? 'Transaction cancelled' : (err.message?.slice(0, 80) || 'Failed');
            updateStatus({ status: 'error', message: errMsg });
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    context: {
                        address,
                        isConnected,
                        hasContract: !!contractAddress,
                    }
                })
            });
            const data = await res.json();
            const rawReply = data.data?.reply || 'Sorry, I could not process that.';

            const { cleanText, navActions, execActions } = parseAIResponse(rawReply);

            const newMsgIndex = newMessages.length;
            const assistantMsg: Message = {
                role: 'assistant',
                content: cleanText || 'Executing your request...',
                navActions: navActions.length > 0 ? navActions : undefined,
                execActions: execActions.length > 0 ? execActions : undefined,
            };
            setMessages([...newMessages, assistantMsg]);

            // Auto-execute any exec actions
            if (execActions.length > 0) {
                for (let i = 0; i < execActions.length; i++) {
                    await executeAction(execActions[i], newMsgIndex, i);
                }
            }
        } catch {
            setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
                title="Backr AI Agent"
            >
                <MessageCircle size={24} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                    <Bot size={20} />
                    <span className="font-semibold text-sm">Backr Agent</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">AGENTIC</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot size={14} className="text-indigo-600" />
                            </div>
                        )}
                        <div className="max-w-[85%] flex flex-col gap-2">
                            {msg.content && (
                                <div className={`px-3 py-2 rounded-2xl text-sm ${
                                    msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-md'
                                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                }`}>
                                    {msg.content}
                                </div>
                            )}

                            {/* Exec actions — show as status cards */}
                            {msg.execActions && msg.execActions.length > 0 && (
                                <div className="space-y-1.5">
                                    {msg.execActions.map((action, j) => (
                                        <div key={j} className={`rounded-xl p-2.5 border text-xs ${
                                            action.status === 'done' ? 'bg-emerald-50 border-emerald-200' :
                                            action.status === 'error' ? 'bg-red-50 border-red-200' :
                                            action.status === 'running' ? 'bg-indigo-50 border-indigo-200' :
                                            'bg-slate-50 border-slate-200'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                {action.status === 'running' && <Loader2 size={14} className="animate-spin text-indigo-600" />}
                                                {action.status === 'done' && <CheckCircle size={14} className="text-emerald-600" />}
                                                {action.status === 'error' && <AlertCircle size={14} className="text-red-600" />}
                                                {action.status === 'pending' && <Zap size={14} className="text-slate-500" />}
                                                <span className="font-bold text-slate-800">
                                                    {action.type === 'create_tier' && `Create Tier: ${action.params.name}`}
                                                    {action.type === 'deposit_gateway' && `Deposit $${action.params.amount} to Gateway`}
                                                    {action.type === 'withdraw_gateway' && `Withdraw $${action.params.amount} from Gateway`}
                                                    {action.type === 'send_tip' && `Send $${action.params.amount} USDC`}
                                                    {action.type === 'subscribe_tier' && `Subscribe: ${action.params.creator} / ${action.params.tier}`}
                                                    {action.type === 'withdraw_earnings' && `Withdraw creator earnings`}
                                                    {action.type === 'create_post' && `New post: ${action.params.title}`}
                                                    {action.type === 'create_commission' && `Commission: ${action.params.title} ($${action.params.budget})`}
                                                    {action.type === 'request_commission' && `Request: ${action.params.title} → ${action.params.creator}`}
                                                    {action.type === 'unlock_ppv' && `Unlock post for $${action.params.amount}`}
                                                </span>
                                            </div>
                                            {action.message && <p className="mt-1 text-slate-600 ml-6">{action.message}</p>}
                                            {action.txHash && (
                                                <a href={`${ARC_EXPLORER_URL}/tx/${action.txHash}`} target="_blank" rel="noopener noreferrer"
                                                   className="mt-1 ml-6 text-indigo-600 hover:underline inline-block">
                                                    View on ArcScan &rarr;
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Nav actions — clickable buttons */}
                            {msg.navActions && msg.navActions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {msg.navActions.map((action, j) => (
                                        <button
                                            key={j}
                                            onClick={() => handleNavAction(action)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100"
                                        >
                                            {action.label}
                                            <ArrowRight size={12} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                <User size={14} className="text-slate-600" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <Bot size={14} className="text-indigo-600" />
                        </div>
                        <div className="bg-slate-100 px-3 py-2 rounded-2xl rounded-bl-md">
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder='Try: "create a Gold tier for $10"'
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
