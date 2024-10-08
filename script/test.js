import { TronWeb } from 'tronweb';
import fs from 'fs';
import dotenv from "dotenv";
dotenv.config();

const tronWeb = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
    privateKey: process.env.PRIVATE_KEY,
});

const poolContractABI =   [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_factoryAddress",
          "type": "address"
        },
        {
          "internalType": "address[2]",
          "name": "_tokens",
          "type": "address[2]"
        },
        {
          "internalType": "uint256[2]",
          "name": "_initialTokenValues",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256[2]",
          "name": "_proportions",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256",
          "name": "_threshold",
          "type": "uint256"
        },
        {
          "internalType": "uint256[2]",
          "name": "_takeProfit",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256[2]",
          "name": "_stopLoss",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256",
          "name": "_timePeriod",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newThreshold",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256[2]",
          "name": "newTakeProfit",
          "type": "uint256[2]"
        },
        {
          "indexed": false,
          "internalType": "uint256[2]",
          "name": "newStopLoss",
          "type": "uint256[2]"
        }
      ],
      "name": "ParametersUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "fromToken",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "toToken",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountToSwap",
          "type": "uint256"
        }
      ],
      "name": "RebalanceExecuted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountConverted",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "StopLossExecuted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountConverted",
          "type": "uint256"
        }
      ],
      "name": "TakeProfitExecuted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "TokensDeposited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "TokensWithdrawn",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "balanceOf",
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
          "internalType": "address[]",
          "name": "_tokens",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "_amounts",
          "type": "uint256[]"
        }
      ],
      "name": "depositTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "factory",
      "outputs": [
        {
          "internalType": "contract PoolFactory",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "fetchPrices",
      "outputs": [
        {
          "internalType": "uint256[2]",
          "name": "",
          "type": "uint256[2]"
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "initialTokenValues",
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
      "inputs": [],
      "name": "lastChecked",
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
      "inputs": [],
      "name": "owner",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "proportions",
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
      "inputs": [],
      "name": "rebalance",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "name": "stopLoss",
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
      "inputs": [],
      "name": "swapRouter",
      "outputs": [
        {
          "internalType": "contract ISwapRouter",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "takeProfit",
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
      "inputs": [],
      "name": "threshold",
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
      "inputs": [],
      "name": "timePeriod",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "tokens",
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
          "internalType": "uint256",
          "name": "newThreshold",
          "type": "uint256"
        },
        {
          "internalType": "uint256[2]",
          "name": "newProportions",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256[2]",
          "name": "newTakeProfit",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256[2]",
          "name": "newStopLoss",
          "type": "uint256[2]"
        }
      ],
      "name": "updateParameters",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_tokens",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "_amounts",
          "type": "uint256[]"
        }
      ],
      "name": "withdrawTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]

const poolFactoryABI =  [
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

const poolFactoryAddress = 'TAdRkJmETfaQDwkq1VADnz1qU7JW9Ej7nf'; // Replace with actual address
const poolFactoryContract = tronWeb.contract(poolFactoryABI, poolFactoryAddress);


// Update this function to fetch pool addresses dynamically
async function getAllPoolAddresses() {
    try {
      const userAddress = "TYZGL81XhUUmke5RHfX1waTkuqy6tVo8SA";
      const pools = await poolFactoryContract.getPoolsByUser(userAddress).call();
    //   return pools.map(address => ({ poolAddress: address }));
    console.log(pools);
    return pools.map((addr) => tronWeb.address.fromHex(addr));
    } catch (error) {
      console.error('Error fetching pool addresses:', error);
      return [];
    }
  }


// Function to check and rebalance pools
async function checkAndRebalancePools() {
  try {
    // const poolAddresses = await getAllPoolAddresses();
    const poolAddresses = ["TYghNfigAbyEZafkm2ecCf8XWXCkEAWu4Y",
        "TFUwpyUecSYSaJWgsej8LjmS69WCmB7Xng"
    ];
    // Process pools one by one
    for (const poolAddress of poolAddresses) {
        await checkAndRebalance(poolAddress);
    }

  } catch (error) {
    console.error('Error in checkAndRebalancePools:', error);
  }
}


async function checkAndRebalance(poolAddress) {
  try {
    const poolContract = tronWeb.contract(poolContractABI , poolAddress);

    const timePeriod = await poolContract.timePeriod().call();
    const lastChecked = await poolContract.lastChecked().call();

    const currentTime = Math.floor(Date.now() / 1000);

    console.log("timePeriod, lastChecked, currentTime", Number(timePeriod), Number(lastChecked), currentTime);

    // if (currentTime >= Number(lastChecked) + Number(timePeriod)) {
      console.log(`Rebalancing pool ${poolAddress}`);

      const tx = await poolContract.rebalance().send({
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: true
      });

      console.log(`Rebalanced pool ${poolAddress}: ${tx}`);
    // }
  } catch (error) {
    console.error(`Error processing pool ${poolAddress}:`, error);
  }
}


async function startMonitoring() {
    const INTERVAL_MS = 1 * 1000;
  
    while (true) {
      try {
        await checkAndRebalancePools();
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
      await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
    }
  }
  

// Start the monitoring loop
startMonitoring();

// Global error handlers
process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', function (reason, p) {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
