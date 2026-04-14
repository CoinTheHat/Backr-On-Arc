'use client';

import { PaymentForm } from '@/app/components/PaymentForm';

export default function TestPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Payment Test Ground</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Test the Consumer Payments flow (Track 1). You can look up users by email/phone or send directly to a wallet address.
                    </p>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <PaymentForm />
                </div>

                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl max-w-md mx-auto">
                    <h3 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                        💡 Testing Tip
                    </h3>
                    <p className="text-amber-700 text-sm leading-relaxed">
                        Try entering a random email or phone number. The system will automatically prepare a Privy embedded wallet for them if one doesn't exist!
                    </p>
                </div>
            </div>
        </div>
    );
}
