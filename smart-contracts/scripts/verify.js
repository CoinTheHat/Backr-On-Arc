const hre = require("hardhat");

async function main() {
    console.log("🔍 Starting contract verification on Mantlescan...\n");

    // Deployed addresses (update these with your actual addresses)
    const IMPLEMENTATION_ADDRESS = "0xFFf8892311ff2c7C4db65DDd53A4A4d4B88F86c0";
    const FACTORY_ADDRESS = "0x602ac361E7523014B2890f2f85Fd0d47C4d00D7d";

    try {
        // 1. Verify Implementation Contract
        console.log("📝 Verifying SubscriptionContract Implementation...");
        console.log(`   Address: ${IMPLEMENTATION_ADDRESS}`);

        await hre.run("verify:verify", {
            address: IMPLEMENTATION_ADDRESS,
            constructorArguments: [],
            contract: "contracts/SubscriptionContract.sol:SubscriptionContract"
        });

        console.log("✅ Implementation verified!\n");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ Implementation already verified!\n");
        } else {
            console.error("❌ Implementation verification failed:", error.message, "\n");
        }
    }

    try {
        // 2. Verify Factory Contract
        console.log("📝 Verifying SubscriptionFactory...");
        console.log(`   Address: ${FACTORY_ADDRESS}`);
        console.log(`   Constructor Args: [${IMPLEMENTATION_ADDRESS}]`);

        await hre.run("verify:verify", {
            address: FACTORY_ADDRESS,
            constructorArguments: [IMPLEMENTATION_ADDRESS],
            contract: "contracts/SubscriptionFactory.sol:SubscriptionFactory"
        });

        console.log("✅ Factory verified!\n");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ Factory already verified!\n");
        } else {
            console.error("❌ Factory verification failed:", error.message, "\n");
        }
    }

    console.log("🎉 Verification process complete!");
    console.log("🔗 Check your contracts on Mantlescan:");
    console.log(`   Implementation: https://mantlescan.xyz/address/${IMPLEMENTATION_ADDRESS}#code`);
    console.log(`   Factory: https://mantlescan.xyz/address/${FACTORY_ADDRESS}#code`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
