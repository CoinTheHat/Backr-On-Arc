import React from 'react';
import Button from './Button';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'compact';
}

export default function EmptyState({
    icon = '📭',
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default'
}: EmptyStateProps) {
    const padding = variant === 'compact' ? 'var(--space-8)' : 'var(--space-16)';

    return (
        <div
            style={{
                padding,
                textAlign: 'center',
                background: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--color-border)'
            }}
        >
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>{icon}</div>
            <h3
                className="text-h3"
                style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}
            >
                {title}
            </h3>
            {description && (
                <p
                    className="text-body-sm"
                    style={{ color: 'var(--color-text-tertiary)', marginBottom: actionLabel ? 'var(--space-lg)' : 0 }}
                >
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
