import { defineChain } from 'viem';
import { createConfig, http } from '@wagmi/core';
import { injected } from '@wagmi/connectors';

export const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.arc.network'],
            webSocket: ['wss://rpc.testnet.arc.network'],
        },
    },
    blockExplorers: {
        default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
    },
    testnet: true,
});

export const config = createConfig({
    chains: [arcTestnet],
    connectors: [injected({ shimDisconnect: false })],
    multiInjectedProviderDiscovery: true,
    transports: {
        [arcTestnet.id]: http(),
    },
});
