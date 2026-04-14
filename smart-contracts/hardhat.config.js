require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        arc: {
            url: "https://rpc.testnet.arc.network",
            chainId: 5042002,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: {
            arc: "no-api-key-needed"
        },
        customChains: [
            {
                network: "arc",
                chainId: 5042002,
                urls: {
                    apiURL: "https://testnet.arcscan.app/api",
                    browserURL: "https://testnet.arcscan.app"
                }
            }
        ]
    },
    sourcify: {
        enabled: false
    }
};
