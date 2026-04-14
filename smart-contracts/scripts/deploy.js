const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy Implementation
    const SubscriptionContract = await hre.ethers.getContractFactory("SubscriptionContract");
    const subscriptionContract = await SubscriptionContract.deploy();
    await subscriptionContract.waitForDeployment();
    const implAddress = await subscriptionContract.getAddress();
    console.log("SubscriptionContract Implementation deployed to:", implAddress);

    // 2. Deploy Factory
    const SubscriptionFactory = await hre.ethers.getContractFactory("SubscriptionFactory");
    const factory = await SubscriptionFactory.deploy(subscriptionContract.target, "0x7424349843A37Ae97221Fd099d34fF460b04a474"); // Specific Platform Treasury Address
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("SubscriptionFactory deployed to:", factoryAddress);

    // Verify on Mantle Testnet (Optional, if verify plugin works)
    console.log("Waiting for block confirmations...");
    // await subscriptionFactory.deploymentTransaction().wait(5);

    // console.log("Verifying...");
    // await hre.run("verify:verify", {
    //   address: factoryAddress,
    //   constructorArguments: [implAddress],
    // });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
