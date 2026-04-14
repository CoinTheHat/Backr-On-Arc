'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
    { img: '/images/home_visuals/art.png', label: 'Visual Arts', name: 'Amara' },
    { img: '/images/home_visuals/gaming.png', label: 'Gaming', name: 'Nexus' },
    { img: '/images/home_visuals/music.png', label: 'Music', name: 'Sonia' },
    { img: '/images/home_visuals/podcast.png', label: 'Podcasts', name: 'Daily Talks' }
];

export default function CategoryShowcase() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % categories.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const current = categories[index];

    return (
        <div
            className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 aspect-video lg:aspect-square group cursor-pointer"
            style={{ isolation: 'isolate' }}
        >
            {/* Border Overlay */}
            <div className="absolute inset-0 border border-white/20 rounded-3xl z-50 pointer-events-none" />
            <AnimatePresence mode='wait'>
                <motion.img
                    key={current.img}
                    src={current.img}
                    alt={current.label}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </AnimatePresence>

            {/* Category Label */}
            <div className="absolute top-6 left-6 z-10">
                <motion.div
                    key={current.label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white font-bold text-sm uppercase tracking-wider"
                >
                    {current.label}
                </motion.div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            <div className="absolute bottom-0 inset-x-0 p-8 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-white p-0.5 overflow-hidden">
                        <img src={current.img} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div>
                        <div className="font-bold text-lg">{current.name}</div>
                        <div className="text-sm text-brand-secondary font-medium uppercase tracking-wider">{current.label}</div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 flex h-1">
                {categories.map((_, i) => (
                    <div key={i} className="flex-1 bg-white/10">
                        {i === index && (
                            <motion.div
                                layoutId="progress"
                                className="h-full bg-brand-secondary"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 3, ease: "linear" }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
