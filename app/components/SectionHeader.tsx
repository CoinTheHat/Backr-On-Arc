import React from 'react';
import Button from './Button';

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
        disabled?: boolean;
    };
    children?: React.ReactNode; // For custom actions
}

export default function SectionHeader({ title, description, action, children }: SectionHeaderProps) {
    return (
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
                <h1 className="text-h1" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
                {description && <p className="text-body-sm" style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', marginTop: '8px' }}>{description}</p>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                {children}
                {action && (
                    <Button
                        onClick={action.onClick}
                        variant={action.variant || "primary"}
                        leftIcon={action.icon}
                        disabled={action.disabled}
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        </div>
    );
}
