import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
    containerStyle?: React.CSSProperties;
    textarea?: boolean;
    className?: string;
}

export default function Input({ label, error, helperText, className, containerStyle, icon, textarea, ...props }: InputProps) {
    return (
        <div className={`flex flex-col gap-1.5 w-full mb-4 ${className || ''}`} style={containerStyle}>
            {label && <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">{label}</label>}

            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none z-10">
                        {icon}
                    </div>
                )}
                {textarea ? (
                    <textarea
                        {...(props as any)}
                        className={`w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px] ${icon ? 'pl-11' : ''} ${error ? 'border-red-500' : ''}`}
                    />
                ) : (
                    <input
                        {...props}
                        className={`w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all h-12 ${icon ? 'pl-11' : ''} ${error ? 'border-red-500' : ''}`}
                    />
                )}
            </div>

            {(error || helperText) && (
                <p className={`text-[11px] font-medium ml-1 ${error ? 'text-red-500' : 'text-slate-400'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
}
