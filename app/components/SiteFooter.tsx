'use client';

import { Rocket } from 'lucide-react';
import Link from 'next/link';

export default function SiteFooter() {
    return (
        <footer className="bg-slate-950 text-white py-20 px-6 md:px-10 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900">
                                <Rocket size={20} />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">Backr</span>
                        </div>
                        <p className="text-white/40 max-w-sm leading-relaxed">
                            The decentralized platform for creators who want to own their work, their audience, and their income.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-widest text-white/30 mb-6">Platform</h4>
                        <ul className="space-y-3">
                            <li><Link href="/explore" className="text-white/60 hover:text-white transition-colors">Explore</Link></li>
                            <li><Link href="/about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-widest text-white/30 mb-6">Legal</h4>
                        <ul className="space-y-3">
                            <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white/30 text-sm">© 2026 Backr Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
