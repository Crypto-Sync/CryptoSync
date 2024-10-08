const poolFactoryABI = {
    "contractName": "PoolFactory",
    "contractAddress": "TTXnecMS7yK2M3kkdF5AYpUEswXXJU5RpD",
    "abi": [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "poolAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "address[2]",
                    "name": "tokens",
                    "type": "address[2]"
                }
            ],
            "name": "PoolCreated",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_newOperator",
                    "type": "address"
                }
            ],
            "name": "addOperator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address[2]",
                            "name": "tokens",
                            "type": "address[2]"
                        },
                        {
                            "internalType": "uint256[2]",
                            "name": "amounts",
                            "type": "uint256[2]"
                        },
                        {
                            "internalType": "uint256[2]",
                            "name": "proportions",
                            "type": "uint256[2]"
                        },
                        {
                            "internalType": "uint256",
                            "name": "threshold",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256[2]",
                            "name": "takeProfit",
                            "type": "uint256[2]"
                        },
                        {
                            "internalType": "uint256[2]",
                            "name": "stopLoss",
                            "type": "uint256[2]"
                        },
                        {
                            "internalType": "uint256",
                            "name": "timePeriod",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct PoolFactory.PoolParams",
                    "name": "params",
                    "type": "tuple"
                }
            ],
            "name": "createPool",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "tokenFrom",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "tokenTo",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amountToProvide",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenPercentage",
                    "type": "uint256"
                }
            ],
            "name": "getAmountRequired",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                }
            ],
            "name": "getDecimalOfToken",
            "outputs": [
                {
                    "internalType": "uint8",
                    "name": "",
                    "type": "uint8"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                }
            ],
            "name": "getOnChainPrice",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "user",
                    "type": "address"
                }
            ],
            "name": "getPoolsByUser",
            "outputs": [
                {
                    "internalType": "address[]",
                    "name": "",
                    "type": "address[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "isOperator",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "operators",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "setPoolAddresses",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "tokenPoolAddresses",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "uniswapFactory",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "userPools",
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
    ]
}

export default poolFactoryABI;