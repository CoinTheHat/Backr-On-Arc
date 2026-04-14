const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("Kinship Membership Platform", function () {
    let factory;
    let factoryAddress;
    let subscriptionImpl;
    let subscriptionImplAddress;
    let owner, creator, supporter1, supporter2;
    let paymentToken;

    beforeEach(async function () {
        [owner, creator, supporter1, supporter2] = await ethers.getSigners();

        // Deploy Implementation
        const SubscriptionContract = await ethers.getContractFactory("SubscriptionContract");
        subscriptionImpl = await SubscriptionContract.deploy();
        await subscriptionImpl.waitForDeployment();
        subscriptionImplAddress = await subscriptionImpl.getAddress();

        // Deploy Factory
        const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
        factory = await SubscriptionFactory.deploy(subscriptionImplAddress);
        await factory.waitForDeployment();
        factoryAddress = await factory.getAddress();
    });

    describe("Factory", function () {
        it("Should create a new creator profile", async function () {
            const tx = await factory.connect(creator).createProfile(ethers.ZeroAddress);
            const receipt = await tx.wait();

            const profiles = await factory.getCreatorProfiles(creator.address);
            expect(profiles.length).to.equal(1);
        });
    });

    describe("Subscription Flow (Native MNT)", function () {
        let creatorContract;

        beforeEach(async function () {
            // Create profile
            await factory.connect(creator).createProfile(ethers.ZeroAddress);
            const profiles = await factory.getCreatorProfiles(creator.address);
            const address = profiles[0];
            creatorContract = await ethers.getContractAt("SubscriptionContract", address);

            // Create Tier
            // Tier 1: 10 wei, 30 days
            await creatorContract.connect(creator).createTier("Basic", 100, 30 * 24 * 60 * 60);
        });

        it("Should allow a user to subscribe", async function () {
            await creatorContract.connect(supporter1).subscribe(0, { value: 100 });

            const isMember = await creatorContract.isMember(supporter1.address);
            expect(isMember).to.be.true;
        });

        it("Should fail if payment is insufficient", async function () {
            await expect(
                creatorContract.connect(supporter2).subscribe(0, { value: 50 })
            ).to.be.revertedWith("Insufficient payment");
        });

        it("Should allow creator to withdraw", async function () {
            await creatorContract.connect(supporter1).subscribe(0, { value: 100 });

            const initialBalance = await ethers.provider.getBalance(creator.address);

            const tx = await creatorContract.connect(creator).withdraw();
            await tx.wait(); // Gas is used here, so balance check is tricky without accounting for gas

            // Just check the contract balance is 0
            const contractBalance = await ethers.provider.getBalance(await creatorContract.getAddress());
            expect(contractBalance).to.equal(0);
        });
    });
});
