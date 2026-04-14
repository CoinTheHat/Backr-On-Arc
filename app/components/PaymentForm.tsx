'use client';

import React, { useState } from 'react';
import { useSend } from '@/app/hooks/useSend';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function PaymentForm() {
    const { send, isSending, error, txHash, reset } = useSend();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient || !amount) return;

        try {
            await send(recipient, amount, memo);
        } catch (err) {
            console.error('Payment failed:', err);
        }
    };

    if (txHash) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-emerald-100 max-w-md mx-auto text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-emerald-500 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Sent!</h2>
                <p className="text-slate-500 mb-6">Your payment of {amount} USDC has been successfully processed.</p>

                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm break-all font-mono text-slate-600 border border-slate-100">
                    Tx: {txHash}
                </div>

                <button
                    onClick={() => {
                        reset();
                        setRecipient('');
                        setAmount('');
                        setMemo('');
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200"
                >
                    Send Another
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Send Payment</h2>
                <p className="text-slate-500">Quickly send USDC to any email, phone, or wallet.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">Recipient</label>
                    <input
                        type="text"
                        placeholder="Email, phone, or 0x..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                        required
                        disabled={isSending}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">Amount (USDC)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            required
                            disabled={isSending}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium tracking-tight">USD</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">Memo (Optional)</label>
                    <textarea
                        placeholder="What's this for?"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 resize-none h-24"
                        disabled={isSending}
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-sm animate-in slide-in-from-top-2">
                        <AlertCircle size={18} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSending || !recipient || !amount}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                    {isSending ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            Send Payment
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
