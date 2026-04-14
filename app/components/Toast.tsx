'use client';


import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const styles = {
        success: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-800', icon: <CheckCircle2 className="text-emerald-500" size={20} /> },
        error: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-800', icon: <XCircle className="text-rose-500" size={20} /> },
        info: { bg: 'bg-white border-slate-100 shadow-xl shadow-slate-200/50', text: 'text-slate-800', icon: <Info className="text-blue-500" size={20} /> }
    };

    const style = styles[type];

    return (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-500 ease-out transform ${style.bg} ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
            {style.icon}
            <span className={`text-sm font-semibold ${style.text}`}>{message}</span>
            <button onClick={() => setIsVisible(false)} className="ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={14} />
            </button>
        </div>
    );
}

// Hook for easier usage
export function useToast() {
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const closeToast = () => setToast(null);

    const ToastComponent = toast ? (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    ) : null;

    return { showToast, addToast: showToast, ToastComponent };
}
