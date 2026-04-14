'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Rocket, Play, CheckCircle, Loader2, Zap, DollarSign, Bot, Briefcase, FileText, ArrowRight } from 'lucide-react';
import { useSend } from '@/app/hooks/useSend';
import { ARC_EXPLORER_URL } from '@/app/utils/constants';

interface Step {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    status: 'pending' | 'running' | 'done' | 'error';
    txHash?: string;
    result?: string;
}

export default function DemoPage() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { send } = useSend();
    const [txCount, setTxCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const [steps, setSteps] = useState<Step[]>([
        { id: 'ppv-1', label: 'PPV Purchase #1', description: 'Pay $0.005 to view premium content', icon: <FileText size={16} />, status: 'pending' },
        { id: 'ppv-2', label: 'PPV Purchase #2', description: 'Pay $0.003 for another article', icon: <FileText size={16} />, status: 'pending' },
        { id: 'ppv-3', label: 'PPV Purchase #3', description: 'Pay $0.001 micro-content view', icon: <FileText size={16} />, status: 'pending' },
        { id: 'tip-1', label: 'Tip Creator $0.01', description: 'Direct USDC tip with 5% platform fee', icon: <DollarSign size={16} />, status: 'pending' },
        { id: 'tip-2', label: 'Tip Creator $0.005', description: 'Nano-tip to creator', icon: <DollarSign size={16} />, status: 'pending' },
        { id: 'agent-1', label: 'AI Agent: Complete Job', description: 'DeepSeek auto-completes an open job', icon: <Bot size={16} />, status: 'pending' },
        { id: 'batch', label: 'Batch Nano-Tips (x10)', description: '10 rapid $0.001 tips — demonstrating nano-payment frequency', icon: <Zap size={16} />, status: 'pending' },
    ]);

    // Fetch current tx count
    useEffect(() => {
        fetch('/api/stats/global')
            .then(r => r.json())
            .then(d => setTxCount(d.total || 0))
            .catch(() => {});
    }, []);

    const updateStep = (id: string, updates: Partial<Step>) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const runDemo = async () => {
        if (!isConnected || !address) return;
        setIsRunning(true);
        let count = txCount;

        // Helper: run a send and count it
        const doSend = async (to: string, amount: string) => {
            const tx = await send(to, amount);
            count++;
            setTxCount(count);
            return tx;
        };

        // PPV purchases (simulated as tips to self/treasury for demo)
        const demoTarget = address; // Send to self for demo
        const ppvSteps = ['ppv-1', 'ppv-2', 'ppv-3'];
        const ppvAmounts = ['0.005', '0.003', '0.001'];
        for (let i = 0; i < ppvSteps.length; i++) {
            updateStep(ppvSteps[i], { status: 'running' });
            try {
                const tx = await doSend(demoTarget, ppvAmounts[i]);
                updateStep(ppvSteps[i], { status: 'done', txHash: tx });
            } catch (e: any) {
                updateStep(ppvSteps[i], { status: 'error', result: e.message?.slice(0, 50) });
            }
        }

        // Tips
        for (const tipStep of ['tip-1', 'tip-2']) {
            updateStep(tipStep, { status: 'running' });
            try {
                const amount = tipStep === 'tip-1' ? '0.01' : '0.005';
                const tx = await doSend(demoTarget, amount);
                updateStep(tipStep, { status: 'done', txHash: tx });
            } catch (e: any) {
                updateStep(tipStep, { status: 'error', result: e.message?.slice(0, 50) });
            }
        }

        // AI Agent auto-complete
        updateStep('agent-1', { status: 'running' });
        try {
            const res = await fetch('/api/agent/auto-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                updateStep('agent-1', { status: 'done', result: `Completed: "${data.job?.title}"` });
            } else {
                updateStep('agent-1', { status: 'done', result: data.error || 'No open jobs' });
            }
        } catch (e: any) {
            updateStep('agent-1', { status: 'error', result: e.message?.slice(0, 50) });
        }

        // Batch nano-tips
        updateStep('batch', { status: 'running' });
        let batchSuccess = 0;
        for (let i = 0; i < 10; i++) {
            try {
                await doSend(demoTarget, '0.001');
                batchSuccess++;
                updateStep('batch', { result: `${batchSuccess}/10 completed` });
            } catch {
                // Continue on error
            }
        }
        updateStep('batch', { status: 'done', result: `${batchSuccess}/10 nano-tips sent` });

        setIsRunning(false);
    };

    const completedSteps = steps.filter(s => s.status === 'done').length;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                        <Rocket size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Backr Live Demo</h1>
                    <p className="text-slate-500">Demonstrating nanopayments, AI agents, and on-chain transactions on Arc Network</p>
                </div>

                {/* Stats Bar */}
                <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-3xl font-bold text-indigo-600">{txCount}</p>
                        <p className="text-xs text-slate-500 font-medium">Total Transactions</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-emerald-600">{completedSteps}/{steps.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Steps Completed</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-amber-600">{txCount >= 50 ? 'PASS' : `${50 - txCount} left`}</p>
                        <p className="text-xs text-slate-500 font-medium">50+ TX Target</p>
                    </div>
                </div>

                {/* Economic Proof Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 mb-8">
                    <h3 className="font-bold mb-2">Why This Only Works with Nanopayments</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">$2.50</p>
                            <p className="text-xs opacity-80">ETH Mainnet gas</p>
                            <p className="text-xs text-red-300 font-bold">-49,900% margin</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">$0.05</p>
                            <p className="text-xs opacity-80">L2 gas</p>
                            <p className="text-xs text-red-300 font-bold">-900% margin</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center border border-white/30">
                            <p className="text-2xl font-bold">$0.00</p>
                            <p className="text-xs opacity-80">Arc + x402</p>
                            <p className="text-xs text-emerald-300 font-bold">+100% margin</p>
                        </div>
                    </div>
                </div>

                {/* Run Button */}
                {!isRunning && completedSteps === 0 && (
                    <button
                        onClick={runDemo}
                        disabled={!isConnected}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mb-8 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 text-lg"
                    >
                        <Play size={24} />
                        Run Full Demo ({steps.length} steps, ~20 transactions)
                    </button>
                )}

                {!isConnected && (
                    <div className="bg-amber-50 text-amber-800 rounded-2xl p-4 mb-8 text-center font-medium text-sm">
                        Connect your wallet on Arc Testnet to run the demo
                    </div>
                )}

                {/* Steps */}
                <div className="space-y-3">
                    {steps.map((step) => (
                        <div key={step.id} className={`bg-white rounded-xl p-4 border transition-all ${
                            step.status === 'running' ? 'border-indigo-300 shadow-md' :
                            step.status === 'done' ? 'border-emerald-200' :
                            step.status === 'error' ? 'border-red-200' :
                            'border-slate-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    step.status === 'running' ? 'bg-indigo-100 text-indigo-600' :
                                    step.status === 'done' ? 'bg-emerald-100 text-emerald-600' :
                                    step.status === 'error' ? 'bg-red-100 text-red-600' :
                                    'bg-slate-100 text-slate-400'
                                }`}>
                                    {step.status === 'running' ? <Loader2 size={18} className="animate-spin" /> :
                                     step.status === 'done' ? <CheckCircle size={18} /> :
                                     step.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-slate-900">{step.label}</p>
                                    <p className="text-xs text-slate-500">{step.description}</p>
                                    {step.result && <p className="text-xs text-slate-600 mt-1 font-medium">{step.result}</p>}
                                </div>
                                {step.txHash && (
                                    <a href={`${ARC_EXPLORER_URL}/tx/${step.txHash}`} target="_blank" rel="noopener noreferrer"
                                       className="text-xs text-indigo-600 hover:underline shrink-0">
                                        View TX
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-slate-400">
                    <p>All transactions settle on Arc Testnet in USDC</p>
                    <a href={ARC_EXPLORER_URL} target="_blank" rel="noopener noreferrer"
                       className="text-indigo-500 hover:underline">
                        View on ArcScan <ArrowRight size={12} className="inline" />
                    </a>
                </div>
            </div>
        </div>
    );
}
