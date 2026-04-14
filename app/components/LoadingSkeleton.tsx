import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    variant?: 'text' | 'rect' | 'circle';
    style?: React.CSSProperties;
    className?: string;
}

const LoadingSkeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    borderRadius,
    variant = 'rect',
    style,
    className = ''
}) => {

    const baseStyle: React.CSSProperties = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1em' : '100%'),
        borderRadius: borderRadius || (variant === 'circle' ? '50%' : 'var(--radius-sm)'),
        backgroundColor: 'var(--color-bg-skeleton)',
        ...style
    };

    return (
        <div
            className={`skeleton ${className}`}
            style={baseStyle}
        />
    );
};

export default LoadingSkeleton;
