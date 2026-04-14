import React from 'react';

interface SkeletonProps {
    variant?: 'text' | 'avatar' | 'card' | 'rect';
    width?: string;
    height?: string;
    className?: string;
    style?: React.CSSProperties;
}

export default function Skeleton({
    variant = 'text',
    width,
    height,
    className = '',
    style = {}
}: SkeletonProps) {
    const baseClass = 'skeleton';
    const variantClass = variant === 'text' ? 'skeleton-text'
        : variant === 'avatar' ? 'skeleton-avatar'
            : variant === 'card' ? 'skeleton-card'
                : '';

    return (
        <div
            className={`${baseClass} ${variantClass} ${className}`}
            style={{
                width: width || (variant === 'text' ? '100%' : undefined),
                height: height || undefined,
                ...style
            }}
            aria-label="Loading..."
        />
    );
}

// Pre-composed skeleton layouts
export function SkeletonCard() {
    return (
        <div className="card-surface" style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <Skeleton variant="avatar" />
                <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                </div>
            </div>
            <Skeleton variant="card" />
            <div style={{ marginTop: 'var(--space-md)' }}>
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" />
            </div>
        </div>
    );
}

export function SkeletonCreatorCard() {
    return (
        <div className="card-surface" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
            <Skeleton variant="avatar" width="80px" height="80px" style={{ margin: '0 auto var(--space-md)' }} />
            <Skeleton variant="text" width="70%" style={{ margin: '0 auto var(--space-sm)' }} />
            <Skeleton variant="text" width="50%" style={{ margin: '0 auto var(--space-md)' }} />
            <Skeleton variant="rect" height="40px" width="100%" />
        </div>
    );
}
