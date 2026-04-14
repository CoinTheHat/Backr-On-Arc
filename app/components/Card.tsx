import React from 'react';

export default function Card({ children, className = '', padding = 'lg', style = {}, ...props }: any) {
    const paddingMap: any = {
        none: '0',
        sm: 'var(--space-4)',
        md: 'var(--space-6)',
        lg: 'var(--space-8)'
    };

    return (
        <div
            className={`card-surface ${className}`}
            style={{
                padding: paddingMap[padding],
                position: 'relative',
                overflow: 'hidden',
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
}
