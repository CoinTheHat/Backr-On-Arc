'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import { createPortal } from 'react-dom';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

type CheckoutStatus = 'idle' | 'pending' | 'success' | 'error';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    tier: {
        name: string;
        price: string;
        benefits?: string[];
    } | null;
    status: CheckoutStatus;
    txHash?: string;
}

export default function CheckoutModal({ isOpen, onClose, onConfirm, tier, status, txHash }: CheckoutModalProps) {
    const [mounted, setMounted] = useState(false);
    const { isConnected } = useAccount();
    const { connect } = useConnect();

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Reset logic if needed? props are controlled by parent
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen || !tier) return null;

    const modalContent = (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Backdrop */}
            <div
                onClick={status === 'pending' || status === 'success' ? undefined : onClose}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
            />

            {/* Modal Card */}
            <div style={{
                position: 'relative',
                width: '100%', maxWidth: '440px',
                background: '#fff',
                borderRadius: '24px',
                boxShadow: '0 40px 80px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', flexDirection: 'column',
                maxHeight: '90vh', overflowY: 'auto' // Handle long content like connector list
            }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}} />

                {/* Header (Hidden on success layout for cleaner look, or kept minimal) */}
                {status !== 'success' && (
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'rgba(255,255,255,0.8)'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            Selected Plan
                        </h3>
                        {status !== 'pending' && (
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '4px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            >
                                <span style={{ fontSize: '1.25rem', lineHeight: 1, color: 'var(--color-text-secondary)' }}>&times;</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Body Content */}
                <div style={{ padding: '32px 24px' }}>

                    {/* STATE 1 & 2: Review & Connect */}
                    {status === 'idle' && (
                        <>
                            {/* Tier Summary */}
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                    Confirm Subscription
                                </div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
                                    {tier.name}
                                </h2>
                                <div style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>${tier.price}</span> / month
                                </div>
                            </div>

                            {/* Perks Preview (Mini) */}
                            <div style={{ background: 'var(--color-bg-page)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>INCLUDES:</div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
                                    {tier.benefits?.slice(0, 3).map((b, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--color-success)', fontSize: '1rem' }}>✓</span> {b}
                                        </li>
                                    ))}
                                    {(tier.benefits?.length || 0) > 3 && (
                                        <li style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', paddingLeft: '20px' }}>
                                            + {(tier.benefits?.length || 0) - 3} more benefits
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Price Breakdown */}
                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                                    <span style={{ fontWeight: 600 }}>{tier.price} USD</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Est. Network Fee</span>
                                    <span style={{ color: 'var(--color-text-tertiary)' }}>~ 0.00 USD</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px dashed var(--color-border)' }}>
                                    <span style={{ fontWeight: 700 }}>Total Due</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>${tier.price}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {!isConnected ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        Choose Wallet to Connect
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <Button
                                            variant="primary"
                                            onClick={() => connect({ connector: injected() })}
                                            style={{ width: '100%', padding: '12px' }}
                                        >
                                            Connect Wallet
                                        </Button>
                                    </div>
                                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                                        Arc Network
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <Button variant="primary" onClick={onConfirm} style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}>
                                        Confirm Payment
                                    </Button>
                                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                        This transaction will be processed on Arc Testnet in USDC.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* STATE 3: Pending */}
                    {status === 'pending' && (
                        <div style={{ textAlign: 'center', padding: '20px 0 40px' }}>
                            <div style={{
                                width: '80px', height: '80px',
                                border: '4px solid rgba(31, 188, 173, 0.2)',
                                borderTopColor: 'var(--color-primary)',
                                borderRadius: '50%',
                                margin: '0 auto 32px',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text-primary)' }}>Processing Payment</h4>
                            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '280px', margin: '0 auto' }}>
                                Please confirm the transaction in your wallet.
                                <br /><span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Do not close this window.</span>
                            </p>
                        </div>
                    )}

                    {/* STATE 4: Success */}
                    {status === 'success' && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{
                                width: '96px', height: '96px',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 32px',
                                color: '#fff', fontSize: '3.5rem', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
                            }}>
                                ✓
                            </div>
                            <h4 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>You're in!</h4>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                You’ve successfully joined the <strong>{tier.name}</strong> tier. <br />All exclusive content is now unlocked.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Button variant="primary" onClick={onClose} style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}>
                                    Start Exploring
                                </Button>
                                {txHash && (
                                    <a
                                        href={`https://testnet.arcscan.app/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    >
                                        View transaction on Explorer ↗
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STATE 5: Error */}
                    {status === 'error' && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{
                                width: '80px', height: '80px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                                color: '#ef4444', fontSize: '2.5rem', fontWeight: 700
                            }}>
                                !
                            </div>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#ef4444' }}>Transaction Failed</h4>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                                We couldn't process your payment. This might be due to insufficient funds or user rejection.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={onConfirm}
                                    style={{ flex: 2 }}
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
