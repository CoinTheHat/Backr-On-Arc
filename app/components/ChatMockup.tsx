'use client';

import { useState, useEffect } from 'react';

export default function ChatMockup() {
    const [messages, setMessages] = useState([
        { id: 1, user: 'Alex Chen', avatar: '👤', text: 'Just unlocked your new track! 🎵', time: '2m' },
        { id: 2, user: 'Sarah Kim', avatar: '👩', text: 'Behind the scenes content is amazing!', time: '5m' }
    ]);

    const [typing, setTyping] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTyping(true);
            setTimeout(() => {
                setMessages(prev => {
                    const newMsg = {
                        id: Date.now(),
                        user: ['Jamie Lee', 'Chris Park', 'Morgan Taylor'][Math.floor(Math.random() * 3)],
                        avatar: ['🙋', '💁', '🙌'][Math.floor(Math.random() * 3)],
                        text: ['Love this community! 💖', 'Can\'t wait for next month!', 'This is why I subscribed 🎉'][Math.floor(Math.random() * 3)],
                        time: 'Just now'
                    };
                    return [...prev.slice(-2), newMsg];
                });
                setTyping(false);
            }, 1500);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            width: '360px',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎨</div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Creator's Circle</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>156 members online</div>
                </div>
            </div>

            {/* Messages */}
            <div style={{ padding: '20px', height: '280px', overflowY: 'auto', background: '#f9fafb' }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: '16px', animation: 'slideIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                {msg.avatar}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{msg.user}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{msg.time}</span>
                                </div>
                                <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '12px', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {typing && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', opacity: 0.6 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💭</div>
                        <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '12px', fontSize: '0.9rem' }}>
                            <span className="typing-dots">•••</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#f3f4f6', borderRadius: '12px' }}>
                    <input
                        placeholder="Join the conversation..."
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem' }}
                        disabled
                    />
                    <button style={{ padding: '8px 16px', background: '#5865F2', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'not-allowed', fontSize: '0.85rem' }}>
                        Send
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .typing-dots {
                    animation: typingDots 1.4s infinite;
                }
                @keyframes typingDots {
                    0%, 20% { content: '•'; }
                    40% { content: '••'; }
                    60%, 100% { content: '•••'; }
                }
            `}} />
        </div>
    );
}
