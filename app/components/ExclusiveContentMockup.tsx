'use client';

import React from 'react';

export default function ExclusiveContentMockup() {
    return (
        <div style={{ position: 'relative', width: '380px', height: '400px' }}>

            {/* Card 1: Underlying Card (Decor) */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '-20px',
                bottom: '-20px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '24px',
                zIndex: 0
            }}></div>

            {/* Main Card: Exclusive Video */}
            <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '0',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                position: 'relative',
                zIndex: 10,
                overflow: 'hidden',
                color: '#000'
            }}>
                {/* Header / User Info */}
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF908B 0%, #FF5E5E 100%)' }}></div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Sarah Jenkins</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Posted 2h ago • <span style={{ color: '#5865F2', fontWeight: 'bold' }}>Gold Tier</span></div>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ height: '200px', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '3rem', color: '#fff' }}>▶</span>
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>14:20</div>
                </div>

                {/* Footer / Description */}
                <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Studio Tour & Gear Setup</div>
                    <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.5', margin: 0 }}>
                        Thanks for supporting! Here is the full breakdown of my new recording setup for the upcoming album.
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '16px', color: '#888', fontSize: '0.9rem' }}>
                        <span>❤️ 1,240</span>
                        <span>💬 42 Comments</span>
                    </div>
                </div>
            </div>

            {/* Floating Notification Badge */}
            <div className="float-medium" style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: '#5865F2',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '99px',
                fontWeight: 'bold',
                boxShadow: '0 10px 20px rgba(88, 101, 242, 0.4)',
                zIndex: 20,
                fontSize: '0.9rem'
            }}>
                ✨ Exclusive Content
            </div>

        </div>
    );
}
