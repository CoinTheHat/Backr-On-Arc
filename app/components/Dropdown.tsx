import React from 'react';

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
}

export default function Dropdown({ trigger, children }: DropdownProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }} onMouseLeave={() => setOpen(false)}>
            <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
                {trigger}
            </div>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    minWidth: '200px',
                    backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 50,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.1s ease'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}
