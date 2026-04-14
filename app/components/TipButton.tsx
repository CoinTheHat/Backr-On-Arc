'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSend } from '../hooks/useSend';
import Button from './Button';
import Input from './Input';
import { Coffee, Send, X, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';

interface TipButtonProps {
    receiverAddress: string;
    creatorName: string;
}

export default function TipButton({ receiverAddress, creatorName }: TipButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-brand-accent hover:bg-brand-accent/90 text-white shadow-lg shadow-brand-accent/20 border-none animate-pulse-slow"
            >
                <Coffee size={18} className="mr-2" />
                Tip {creatorName}
            </Button>
            {isOpen && <TipModal receiverAddress={receiverAddress} creatorName={creatorName} onClose={() => setIsOpen(false)} />}
        </>
    );
}

function TipModal({ receiverAddress, creatorName, onClose }: { receiverAddress: string, creatorName: string, onClose: () => void }) {
    const { address } = useAccount();
    const { send, isSending } = useSend();
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [step, setStep] = useState<'amount' | 'confirm' | 'success'>('amount');
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        if (!amount) return;
        setError(null);

        try {
            // 1. Send Transaction
            const txHash = await send(receiverAddress, amount, message || `Tip for ${creatorName}`);

            if (!txHash) throw new Error("Transaction failed");

            // 2. Save Tip to DB
            if (address) {
                await fetch('/api/tips', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: address,
                        receiver: receiverAddress,
                        amount: amount,
                        message: message,
                        currency: 'USDC',
                        txHash: txHash
                    })
                });
            }

            // 3. Success
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            setStep('success');
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to send tip. Please try again.");
        }
    };

    if (step === 'success') {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
                    <h3 className="text-xl font-bold mb-2">Tip Sent!</h3>
                    <p className="text-gray-500 mb-6">You're amazing! {creatorName} will receive your support shortly.</p>
                    <Button onClick={onClose} className="w-full justify-center">Close</Button>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>

                <h3 className="text-lg font-bold mb-1">Support {creatorName}</h3>
                <p className="text-sm text-gray-500 mb-6">Send USDC tip on Arc Network</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                    {['1', '5', '10'].map((val) => (
                        <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`py-3 rounded-xl border font-bold transition-all ${amount === val ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 hover:border-brand-primary/30'}`}
                        >
                            ${val}
                        </button>
                    ))}
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custom Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-7 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message (Optional)</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 h-20 resize-none"
                        placeholder="Say something nice..."
                    />
                </div>

                <Button
                    onClick={handleSend}
                    disabled={!amount || isSending}
                    className="w-full justify-center py-3 text-lg font-bold shadow-lg shadow-brand-primary/20"
                >
                    {isSending ? 'Sending...' : `Send $${amount || '0'}`}
                </Button>
            </div>
        </div>,
        document.body
    );
}
