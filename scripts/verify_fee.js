const { createPublicClient, http, parseAbi } = require('viem');
const { mantle } = require('viem/chains');

const FACTORY_ADDRESS = "0x5a91d29B8AA65B0a90d8861fEA0dF3f184f88E17";
const RPC_URL = "https://mantle-rpc.publicnode.com";

const client = createPublicClient({
    chain: mantle,
    transport: http(RPC_URL)
});

// Common fee variable names
const FEE_ABI = parseAbi([
    'function platformFee() view returns (uint256)',
    'function protocolFee() view returns (uint256)',
    'function fee() view returns (uint256)',
    'function getPlatformFee() view returns (uint256)',
    'function getProtocolFee() view returns (uint256)',
    'function owner() view returns (address)',
    'function feeDestination() view returns (address)'
]);

async function check() {
    console.log("Checking Factory at:", FACTORY_ADDRESS);

    const checks = [
        'platformFee', 'protocolFee', 'fee', 'getPlatformFee', 'getProtocolFee', 'owner', 'feeDestination'
    ];

    for (const fn of checks) {
        try {
            const data = await client.readContract({
                address: FACTORY_ADDRESS,
                abi: FEE_ABI,
                functionName: fn
            });
            console.log(`✅ ${fn}:`, data.toString());
        } catch (e) {
            // console.log(`❌ ${fn}: Not found or revert`); 
            // Silent fail to keep clean
        }
    }
}

check();
