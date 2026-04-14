export const SUBSCRIPTION_FACTORY_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "profileAddress",
                "type": "address"
            }
        ],
        "name": "ProfileCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_paymentToken",
                "type": "address"
            }
        ],
        "name": "createProfile",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_creator",
                "type": "address"
            }
        ],
        "name": "getProfile",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const SUBSCRIPTION_CONTRACT_ABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_name", "type": "string" },
            { "internalType": "uint256", "name": "_price", "type": "uint256" },
            { "internalType": "uint256", "name": "_duration", "type": "uint256" }
        ],
        "name": "createTier",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_tierId", "type": "uint256" }
        ],
        "name": "toggleTier",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_tierId", "type": "uint256" }
        ],
        "name": "subscribe",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "_user", "type": "address" }
        ],
        "name": "isMember",
        "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "paymentToken",
        "outputs": [
            { "internalType": "contract IERC20", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTiers",
        "outputs": [
            {
                "components": [
                    { "internalType": "string", "name": "name", "type": "string" },
                    { "internalType": "uint256", "name": "price", "type": "uint256" },
                    { "internalType": "uint256", "name": "duration", "type": "uint256" },
                    { "internalType": "bool", "name": "isActive", "type": "bool" }
                ],
                "internalType": "struct SubscriptionContract.Tier[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const TIP20_ABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export const ERC8183_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "provider",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "evaluator",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "expiredAt",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "hook",
                "type": "address"
            }
        ],
        "name": "createJob",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "jobId",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "jobId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "budget",
                "type": "uint256"
            }
        ],
        "name": "setBudget",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "jobId",
                "type": "uint256"
            }
        ],
        "name": "fund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "jobId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "deliverable",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "params",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "fee",
                "type": "uint256"
            }
        ],
        "name": "submit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "jobId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "reason",
                "type": "bytes32"
            }
        ],
        "name": "complete",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "jobId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "reason",
                "type": "bytes32"
            }
        ],
        "name": "reject",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "jobId",
                "type": "uint256"
            }
        ],
        "name": "getJob",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "client",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "provider",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "evaluator",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expiredAt",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "address",
                        "name": "hook",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "budget",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "deliverable",
                        "type": "bytes32"
                    }
                ],
                "internalType": "struct ERC8183.Job",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "jobId",
                "type": "uint256"
            }
        ],
        "name": "claimRefund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;
