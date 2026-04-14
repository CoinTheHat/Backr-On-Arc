import React from 'react';

interface BrandLogoProps {
    className?: string; // For sizing like w-8 h-8
    withText?: boolean; // Whether to show "Backr" text next to it
    textClassName?: string; // Styling for the text
    theme?: 'light' | 'dark'; // To force specific text color if needed, otherwise inherits
    color?: string; // Explicit color override
}

export default function BrandLogo({
    className = "w-8 h-8",
    withText = true,
    textClassName = "font-bold text-xl tracking-tight ml-2",
    theme,
    color
}: BrandLogoProps) {

    // Default text color logic
    const textColor = color ? color : (theme === 'dark' ? '#ffffff' : 'currentColor');

    return (
        <div className="flex items-center select-none">
            {/* Logo Mark - SVG */}
            <div className={`${className} relative flex items-center justify-center`}>
                <img
                    src="/logo/backr-mark-b.svg"
                    alt="Backr"
                    className="w-full h-full object-contain"
                    style={{
                        filter: theme === 'dark' ? 'none' : 'none' // You might want brightness(0) for pure black if the SVG is colored, but let's see the SVG first. 
                        // Actually, if it's a fixed color SVG, we might need CSS variables or mask.
                        // Assuming the SVG is the 'B' mark. Let's use it as an image for now.
                    }}
                />
            </div>

            {/* Optional Text */}
            {withText && (
                <span className={textClassName} style={{ fontFamily: 'var(--font-serif)', color: textColor }}>
                    Backr
                </span>
            )}
        </div>
    );
}
