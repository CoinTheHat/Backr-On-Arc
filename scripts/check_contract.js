const { createPublicClient, http, parseAbi } = require('viem');
const { mantleSepolia } = require('viem/chains');

// Factory Address from utils/abis.ts
const FACTORY_ADDRESS = "0x5a91d29B8AA65B0a90d8861fEA0dF3f184f88E17";

// Guessing common fee-related function signatures
const ABI = parseAbi([
    "function owner() view returns (address)",
    "function platformFee() view returns (uint256)",
    "function feeDestination() view returns (address)",
    "function getFee() view returns (uint256)",
    "function protocolFeeBasisPoints() view returns (uint256)",
    "function treasury() view returns (address)"
]);

async function main() {
    const client = createPublicClient({
        chain: mantleSepolia,
        transport: http("https://rpc.sepolia.mantle.xyz") // Or other RPC
    });

    console.log("Checking contract:", FACTORY_ADDRESS);

    try {
        const owner = await client.readContract({ address: FACTORY_ADDRESS, abi: ABI, functionName: 'owner' });
        console.log("Owner:", owner);
    } catch (e) { console.log("No 'owner' function or failed"); }

    try {
        const fee = await client.readContract({ address: FACTORY_ADDRESS, abi: ABI, functionName: 'platformFee' });
        console.log("platformFee:", fee.toString());
    } catch (e) { console.log("No 'platformFee' function"); }

    try {
        const dest = await client.readContract({ address: FACTORY_ADDRESS, abi: ABI, functionName: 'feeDestination' });
        console.log("feeDestination:", dest);
    } catch (e) { console.log("No 'feeDestination' function"); }

    try {
        const fee = await client.readContract({ address: FACTORY_ADDRESS, abi: ABI, functionName: 'protocolFeeBasisPoints' });
        console.log("protocolFeeBasisPoints:", fee.toString());
    } catch (e) { console.log("No 'protocolFeeBasisPoints' function"); }

    try {
        const treasury = await client.readContract({ address: FACTORY_ADDRESS, abi: ABI, functionName: 'treasury' });
        console.log("treasury:", treasury);
    } catch (e) { console.log("No 'treasury' function"); }
}

main();
