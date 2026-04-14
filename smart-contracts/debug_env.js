require("dotenv").config();
const key = process.env.PRIVATE_KEY;

if (!key) {
    console.log("ERROR: PRIVATE_KEY is empty or missing.");
} else {
    console.log(`SUCCESS: Found key of length ${key.length}`);
    if (key.startsWith("0x")) console.log("Key format: Hex string (starts with 0x)");
    else console.log("Key format: Raw string (no 0x prefix)");
}

const hre = require("hardhat");
console.log("Checking network connection...");
// Attempt to fetch chain ID manually
(async () => {
    try {
        const provider = new hre.ethers.JsonRpcProvider("https://rpc.testnet.mantle.xyz");
        const net = await provider.getNetwork();
        console.log("Connected to network:", net.name, "Chain ID:", net.chainId.toString());
    } catch (e) {
        console.log("Network Connection Error:", e.message);
    }
})();
