'use client';

import { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';
import SectionHeader from '../../components/SectionHeader';
import { useAccount } from 'wagmi';

export default function AudiencePage() {
    const { address } = useAccount();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchMembers = () => {
        if (!address) return;
        setLoading(true);
        fetch(`/api/audience?creator=${address.toLowerCase()}`)
            .then(res => res.json())
            .then(data => {
                setMembers(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setMembers([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (address) fetchMembers();
    }, [address]);

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.subscriberAddress.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const activeCount = members.filter(m => m.status === 'Active').length;
    const expiringCount = members.filter(m => {
        if (m.status !== 'Active') return false;
        const daysLeft = (new Date(m.expiresAt).getTime() - Date.now()) / (1000 * 3600 * 24);
        return daysLeft < 7 && daysLeft > 0;
    }).length;

    const handleExportCSV = () => {
        const headers = ["Member", "Tier", "Join Date", "Expires", "Status"];
        const rows = filteredMembers.map(m => [
            m.subscriberAddress,
            m.tierName,
            new Date(m.createdAt).toLocaleDateString(),
            new Date(m.expiresAt).toLocaleDateString(),
            m.status
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audience_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyAddress = (addr: string) => {
        navigator.clipboard.writeText(addr);
        // Could pop a toast here, but for now simple copy
    };

    return (
        <div className="page-container" style={{ paddingBottom: '100px' }}>
            <SectionHeader
                title="Audience"
                description="View and manage your active supporters."
            />

            {/* Filters Row */}
            <Card variant="surface" style={{ marginBottom: '24px', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Top Row: Chips */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ padding: '6px 12px', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
                            Active: <span style={{ color: 'var(--color-text-primary)' }}>{activeCount}</span>
                        </div>
                        <div style={{ padding: '6px 12px', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-warning)' }}></span>
                            Expiring: <span style={{ color: 'var(--color-text-primary)' }}>{expiringCount}</span>
                        </div>
                    </div>

                    {/* Bottom Row: Controls */}
                    <div className="filter-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                            <Input
                                placeholder="Search by address..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                style={{ paddingLeft: '44px', margin: 0, height: '44px', width: '100%' }}
                            />
                        </div>

                        <div className="action-row" style={{ display: 'flex', gap: '12px', flex: '1 1 auto' }}>
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @media (max-width: 640px) { .filter-controls { flex-direction: column; align-items: stretch; } .action-row { width: 100%; } }
                             `}} />
                            <div style={{ position: 'relative', flexGrow: 1, minWidth: '150px' }}>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                    className="focus-ring"
                                    style={{
                                        width: '100%',
                                        padding: '0 16px',
                                        height: '44px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-surface)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="All">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                </select>
                            </div>

                            <Button variant="outline" onClick={handleExportCSV} style={{ height: '44px', whiteSpace: 'nowrap' }} leftIcon={<span>📥</span>}>
                                Export
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Desktop Table View */}
            <Card padding="none" className="desktop-view" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ background: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Member</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Tier</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Joined</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Expires</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Status</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}>
                                        <td colSpan={6} style={{ padding: '24px' }}>
                                            <div style={{ height: '32px', width: '100%', background: 'linear-gradient(90deg, var(--color-bg-page) 25%, #f3f3f3 50%, var(--color-bg-page) 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite', borderRadius: '4px' }}></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-secondary)' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>👥</div>
                                        <div style={{ fontWeight: 600 }}>No supporters found</div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)' }}>Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedMembers.map((m, i) => (
                                    <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {/* Identicon or Avatar */}
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: m.subscriberAvatar ? `url(${m.subscriberAvatar}) center/cover` : `hsl(${parseInt(m.subscriberAddress.slice(2, 4), 16)}, 70%, 60%)`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontSize: '0.8rem', fontWeight: 'bold',
                                                    flexShrink: 0
                                                }}>
                                                    {!m.subscriberAvatar && m.subscriberAddress.substring(2, 4).toUpperCase()}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {m.subscriberName && (
                                                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.subscriberName}</div>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: m.subscriberName ? 400 : 600, color: m.subscriberName ? 'var(--color-text-secondary)' : 'var(--color-text-primary)', fontSize: m.subscriberName ? '0.8rem' : '0.9rem' }}>
                                                            {m.subscriberAddress.slice(0, 6)}...{m.subscriberAddress.slice(-4)}
                                                        </span>
                                                        <button onClick={() => copyAddress(m.subscriberAddress)} title="Copy" style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '0.9rem' }}>📋</button>
                                                        <a href={`https://testnet.arcscan.app/address/${m.subscriberAddress}`} target="_blank" title="View on ArcScan" style={{ textDecoration: 'none', opacity: 0.5, fontSize: '0.9rem' }}>🔗</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                                            <span style={{ background: 'var(--color-bg-page)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.9rem' }}>{m.tierName}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{new Date(m.expiresAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                background: m.status === 'Active' ? 'var(--color-bg-surface)' : 'var(--color-bg-page)',
                                                border: m.status === 'Active' ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
                                                color: m.status === 'Active' ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                                                {(m.status || 'Unknown').toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <Button variant="ghost" size="sm">Manage</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Stats */}
                {!loading && filteredMembers.length > 0 && (
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-surface)' }}>
                        <div className="text-body-sm">
                            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</strong> of <strong>{filteredMembers.length}</strong> members
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Mobile Cards View */}
            <div className="mobile-view" style={{ display: 'none', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <Card style={{ padding: '32px', textAlign: 'center' }}>Loading members...</Card>
                ) : filteredMembers.length === 0 ? (
                    <Card style={{ padding: '32px', textAlign: 'center' }}>No members found.</Card>
                ) : (
                    paginatedMembers.map((m, i) => (
                        <Card key={i} padding="md">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: m.subscriberAvatar ? `url(${m.subscriberAvatar}) center/cover` : `hsl(${parseInt(m.subscriberAddress.slice(2, 4), 16)}, 70%, 60%)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontSize: '0.9rem', fontWeight: 'bold',
                                        flexShrink: 0
                                    }}>
                                        {!m.subscriberAvatar && m.subscriberAddress.substring(2, 4).toUpperCase()}
                                    </div>
                                    <div>
                                        {m.subscriberName && <div style={{ fontWeight: 600, fontSize: '1rem' }}>{m.subscriberName}</div>}
                                        <div style={{ fontWeight: m.subscriberName ? 400 : 600, fontFamily: 'monospace', fontSize: '0.85rem', color: m.subscriberName ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                                            {m.subscriberAddress.slice(0, 6)}...{m.subscriberAddress.slice(-4)}
                                        </div>
                                        <div className="text-caption">{m.tierName}</div>
                                    </div>
                                </div>
                                <span style={{
                                    color: m.status === 'Active' ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                                    fontWeight: 700, fontSize: '0.8rem'
                                }}>
                                    {m.status}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <div className="text-caption">Joined</div>
                                    <div style={{ fontSize: '0.9rem' }}>{new Date(m.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-caption">Expires</div>
                                    <div style={{ fontSize: '0.9rem' }}>{new Date(m.expiresAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button variant="outline" size="sm" onClick={() => copyAddress(m.subscriberAddress)} style={{ flex: 1 }}>Copy Address</Button>
                                <Button variant="ghost" size="sm">Manage</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media (max-width: 768px) {
                    .desktop-view { display: none !important; }
                    .mobile-view { display: flex !important; }
                }
                .table-row-hover:hover {
                    background-color: var(--color-bg-surface-hover) !important;
                }
                @keyframes loading {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }
            `}} />
        </div>
    );
}
