'use client';

import { useEffect, useState } from 'react';

export default function CreatorCollage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[600px] w-full animate-pulse bg-gray-50 rounded-3xl" />;

    return (
        <div className="relative w-full h-[650px] overflow-visible perspective-[1200px] pointer-events-none select-none">

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-brand-secondary/20 to-brand-primary/10 rounded-full blur-3xl opacity-60 animate-pulse-slow" />

            {/* 1. Main Portrait (Center) */}
            <div className="absolute top-[10%] left-[15%] w-[280px] md:w-[320px] aspect-[3/4] rounded-2xl shadow-2xl overflow-hidden z-20 border-[6px] border-white rotate-[-3deg] hover:rotate-0 transition-transform duration-700 ease-out">
                <img
                    src="/images/home_visuals/creator1.png"
                    className="w-full h-full object-cover transform scale-105 hover:scale-110 transition-transform duration-1000"
                    alt="Creator Portrait"
                />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <p className="font-playfair text-xl font-bold">Your Name</p>
                    <p className="text-xs opacity-90 uppercase tracking-widest">Creator</p>
                </div>
            </div>

            <div className="absolute top-[5%] right-[5%] w-[200px] aspect-video bg-black rounded-xl shadow-xl z-30 border-4 border-white rotate-[6deg] animate-float-slow overflow-hidden">
                <img
                    src="/images/home_visuals/artist-work.png"
                    className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                    alt="Art Piece"
                />
            </div>

            {/* 3. Audio Player (Bottom Left) */}
            <div className="absolute bottom-[20%] left-[5%] w-[240px] bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] z-30 p-4 border border-gray-100 rotate-[4deg] animate-float-medium">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">🎙️</div>
                    <div className="flex-1 min-w-0">
                        <div className="h-2 w-3/4 bg-gray-200 rounded mb-1.5" />
                        <div className="h-2 w-1/2 bg-gray-100 rounded" />
                    </div>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-brand-primary rounded-full" />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                    <span>--:--</span>
                    <span>--:--</span>
                </div>
            </div>

            {/* 4. Text Snippet (Bottom Right) */}
            <div className="absolute bottom-[10%] right-[10%] w-[220px] bg-white rounded-xl shadow-xl z-20 p-5 rotate-[-5deg] border border-gray-100 animate-float-fast">
                <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-200 rounded" />
                    <div className="h-2 w-5/6 bg-gray-200 rounded" />
                    <div className="h-2 w-4/5 bg-gray-200 rounded" />
                    <div className="h-2 w-full bg-gray-100 rounded" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] bg-brand-secondary/10 text-brand-secondary px-2 py-0.5 rounded-full font-bold">POST</span>
                    <span className="text-[10px] text-gray-400">2h ago</span>
                </div>
            </div>

            {/* 5. Floating Earnings (Center Overlap) */}
            <div className="absolute top-[60%] left-[50%] -translate-x-1/2 w-auto bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 z-40 px-6 py-3 flex items-center gap-4 animate-bounce-gentle">
                <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] shadow-sm bg-gradient-to-br from-gray-100 to-gray-300`}>
                            {['👩‍🎤', '👨‍🎨', '🧛'][i - 1]}
                        </div>
                    ))}
                </div>
                <div className="pr-1">
                    <p className="text-xs text-brand-secondary font-bold uppercase tracking-wider">New Backrs</p>
                </div>
            </div>

        </div>
    );
}
