'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, DollarSign, TrendingDown, Check } from 'lucide-react';

const rows = [
    {
        chain: 'Ethereum Mainnet',
        cost: '~$2.50',
        verdict: 'Impossible for $0.005 content',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
    },
    {
        chain: 'L2 (Optimism / Base)',
        cost: '~$0.05',
        verdict: 'Still 10x the content price',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
    },
    {
        chain: 'Arc (standard)',
        cost: '~$0.001',
        verdict: 'Viable but adds up',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
    },
    {
        chain: 'Arc + Circle Nanopayments',
        cost: '$0.00 (gasless)',
        verdict: 'Perfect for micro-content',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
    },
];

export default function GasComparisonPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="max-w-3xl mx-auto px-4 py-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-7 h-7 text-purple-400" />
                    <h1 className="text-3xl font-bold">Why Nanopayments on Arc?</h1>
                </div>
                <p className="text-gray-400 mb-10">
                    Gas fees determine whether micro-content economies are viable. Here is
                    how the options compare.
                </p>

                {/* Comparison Table */}
                <div className="overflow-hidden rounded-xl border border-gray-800">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-900/80 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-5 py-3 font-medium">Network</th>
                                <th className="px-5 py-3 font-medium">Cost / tx</th>
                                <th className="px-5 py-3 font-medium">Verdict</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr
                                    key={r.chain}
                                    className={`border-t border-gray-800/60 ${r.bg}`}
                                >
                                    <td className="px-5 py-4 font-medium">{r.chain}</td>
                                    <td className={`px-5 py-4 font-semibold ${r.color}`}>
                                        {r.cost}
                                    </td>
                                    <td className="px-5 py-4 text-gray-300 text-sm">
                                        {i === rows.length - 1 && (
                                            <Check className="inline w-4 h-4 text-green-400 mr-1 -mt-0.5" />
                                        )}
                                        {r.verdict}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Key Insight */}
                <div className="mt-10 rounded-xl border border-purple-500/30 bg-purple-500/5 p-6">
                    <div className="flex items-start gap-3">
                        <DollarSign className="w-6 h-6 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                            <h2 className="text-lg font-semibold text-purple-300 mb-1">
                                Key Insight
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                With x402 nanopayments, creators can charge{' '}
                                <span className="text-white font-semibold">$0.001 per article view</span>{' '}
                                and keep <span className="text-green-400 font-semibold">100% margin</span>.
                                No gas overhead, no middlemen, just direct creator-to-supporter
                                value transfer.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Economic Proof Table */}
                <div className="mt-10 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="bg-gray-900/80 px-5 py-3">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Economic Proof: $0.005 Content View</h2>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                                <th className="px-5 py-2">Network</th>
                                <th className="px-5 py-2">Revenue</th>
                                <th className="px-5 py-2">Gas Cost</th>
                                <th className="px-5 py-2">Net Margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-800/50">
                                <td className="px-5 py-3 font-medium">Ethereum</td>
                                <td className="px-5 py-3">$0.005</td>
                                <td className="px-5 py-3 text-red-400">$2.50</td>
                                <td className="px-5 py-3 text-red-400 font-bold">-49,900%</td>
                            </tr>
                            <tr className="border-b border-gray-800/50">
                                <td className="px-5 py-3 font-medium">Optimism / Base</td>
                                <td className="px-5 py-3">$0.005</td>
                                <td className="px-5 py-3 text-orange-400">$0.05</td>
                                <td className="px-5 py-3 text-orange-400 font-bold">-900%</td>
                            </tr>
                            <tr className="border-b border-gray-800/50">
                                <td className="px-5 py-3 font-medium">Arc (standard)</td>
                                <td className="px-5 py-3">$0.005</td>
                                <td className="px-5 py-3 text-yellow-400">$0.001</td>
                                <td className="px-5 py-3 text-yellow-400 font-bold">-20%</td>
                            </tr>
                            <tr className="bg-green-500/5">
                                <td className="px-5 py-3 font-bold text-green-400">Arc + x402</td>
                                <td className="px-5 py-3">$0.005</td>
                                <td className="px-5 py-3 text-green-400 font-bold">$0.000</td>
                                <td className="px-5 py-3 text-green-400 font-bold">+100%</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-gray-900/40 text-xs text-gray-500">
                        Revenue = $0.005 per content view | Platform fee (5%) = $0.00025 | Creator receives $0.00475 per view
                    </div>
                </div>

                {/* Extra context */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-gray-900/60 border border-gray-800 p-4 text-center">
                        <TrendingDown className="w-5 h-5 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold">$0.00</p>
                        <p className="text-xs text-gray-400 mt-1">Gas per nanopayment</p>
                    </div>
                    <div className="rounded-lg bg-gray-900/60 border border-gray-800 p-4 text-center">
                        <DollarSign className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold">100%</p>
                        <p className="text-xs text-gray-400 mt-1">Creator margin</p>
                    </div>
                    <div className="rounded-lg bg-gray-900/60 border border-gray-800 p-4 text-center">
                        <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold">&lt;1s</p>
                        <p className="text-xs text-gray-400 mt-1">Settlement time</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
