import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function Button({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    ...props
}: ButtonProps) {

    // Base styles
    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid transparent',
        cursor: props.disabled || isLoading ? 'not-allowed' : 'pointer',
        boxShadow: 'none',
        lineHeight: 1,
        gap: 'var(--space-2)',
        opacity: props.disabled || isLoading ? 0.6 : 1,
        whiteSpace: 'nowrap',
    };

    // Size variations
    const sizeStyles = {
        sm: {
            padding: '0 var(--space-3)',
            fontSize: 'var(--text-body-sm)',
            height: '32px',
        },
        md: {
            padding: '0 var(--space-4)',
            fontSize: '0.95rem',
            height: '40px',
        },
        lg: {
            padding: '0 var(--space-6)',
            fontSize: 'var(--text-body)',
            height: '48px',
        }
    };

    // Variant variations
    const variantStyles: Record<string, any> = {
        primary: {
            background: 'var(--color-primary)',
            color: '#fff',
            borderColor: 'transparent',
        },
        secondary: {
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
        },
        outline: {
            background: 'transparent',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            borderColor: 'transparent',
        },
        danger: {
            background: 'var(--color-error)',
            color: '#fff',
            borderColor: 'transparent',
        }
    };

    // Compute styles
    const currentVariant = variantStyles[variant];
    const currentSize = sizeStyles[size];

    return (
        <button
            {...props}
            style={{
                ...baseStyles,
                ...currentSize,
                ...currentVariant,
                ...props.style // Allow overrides
            }}
            className={`focus-ring ${className}`}
            onMouseEnter={(e) => {
                if (props.disabled) return;
                if (variant === 'primary') e.currentTarget.style.background = 'var(--color-primary-hover)';
                if (variant === 'secondary') {
                    e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
                if (variant === 'ghost') e.currentTarget.style.color = 'var(--color-text-primary)';
                if (variant === 'outline') e.currentTarget.style.borderColor = 'var(--color-border-hover)';
            }}
            onMouseLeave={(e) => {
                if (props.disabled) return;
                // Reset to original
                if (variant === 'primary') e.currentTarget.style.background = 'var(--color-primary)';
                if (variant === 'secondary') {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }
                if (variant === 'ghost') e.currentTarget.style.color = 'var(--color-text-secondary)';
                if (variant === 'outline') e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
        >
            {isLoading && (
                <span className="animate-spin" style={{ marginRight: 8 }}>◌</span>
            )}
            {!isLoading && leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
}
