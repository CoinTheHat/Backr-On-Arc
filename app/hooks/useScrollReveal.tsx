"use client";

import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(threshold = 0.1) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element); // Only verify once
                }
            },
            {
                threshold,
                rootMargin: '0px 0px -50px 0px' // Slightly before bottom of screen
            }
        );

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [threshold]);

    return { ref, isVisible };
}

// Optional: Component wrapper for ease of use
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
    const { ref, isVisible } = useScrollReveal();

    const delayClass = delay === 100 ? 'delay-100' : delay === 200 ? 'delay-200' : delay === 300 ? 'delay-300' : '';

    return (
        <div
            ref={ref}
            className={`reveal-on-scroll ${isVisible ? 'is-visible' : ''} ${delayClass} ${className}`}
        >
            {children}
        </div>
    );
}
