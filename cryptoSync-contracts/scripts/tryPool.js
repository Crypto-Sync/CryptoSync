import { TronWeb } from 'tronweb';

import dotenv from "dotenv";
dotenv.config();

// // Setup TronWeb instance for Nile Testnet
// const fullNode = 'https://api.nileex.io'; // Nile Testnet URL
// const solidityNode = 'https://api.nileex.io';
// const eventServer = 'https://event.nileex.io';
const privateKey = process.env.PRIVATE_KEY;

// const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

const tronWeb = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
    privateKey
});

// Factory contract address (use the EVM version for TronWeb)


// ABI for the createPool function (simplified version, you may want to include the full ABI for all interactions)
const abi = [
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
    }
];

const factoryContract = tronWeb.contract(abi, "TAdRkJmETfaQDwkq1VADnz1qU7JW9Ej7nf");


// async function createPool() {

//     try {

//         // Replace with the correct token addresses and amounts
//         const tokens = ['0xe1B8d3435d25aBEc5986A2ddE4E32cC193e5d2F0', '0xECa9bC828A3005B9a3b909f2cc5c2a54794DE05F'];  // Replace with actual token addresses
//         const amounts = ['100000000000000000000', '200000000']; // Example amounts (100 token syncX and 200 USDT)
//         const proportions = [5000, 5000];  // 50% and 50% allocation
//         const threshold = 1000;  // Example threshold (5%)
//         const takeProfit = [10500, 10500];  // Take profit at 105% for both tokens
//         const stopLoss = [1000000, 50000];  // Stop loss at 95% for both tokens
//         const timePeriod = 86400;  // Example: 1 day in seconds

//         // Pool parameters
//         const poolParams = {
//             tokens,
//             amounts,
//             proportions,
//             threshold,
//             takeProfit,
//             stopLoss,
//             timePeriod
//         };

//         // Call the createPool function
//         const result = await factoryContract.createPool(poolParams).send({
//             from: tronWeb.defaultAddress.base58, // This is the address that sends the transaction
//             feeLimit: 1000000000 //          // Call value set to 0 TRX
//         });

//         console.log('Pool created successfully! Transaction:', result);
//     } catch (error) {
//         console.error('Error creating pool:', error);
//     }
// }

// Execute the createPool function



// const poolParams = {
//     tokens: ['0xe1B8d3435d25aBEc5986A2ddE4E32cC193e5d2F0', '0xECa9bC828A3005B9a3b909f2cc5c2a54794DE05F'], // address[2]
//     amounts: ['100000000000000000000', '200000000'], // uint256[2]
//     proportions: [5000, 5000], // uint256[2]
//     threshold: 1000, // uint256
//     takeProfit: [10500, 10500], // uint256[2]
//     stopLoss: [1000000, 50000], // uint256[2]
//     timePeriod: 86400 // uint256
// };

// async function createPool() {
//     try {
//         // Initialize the contract instance

//         console.log("factoryContract: ", factoryContract);

//         const contractInstance = await tronWeb.contract().at('TAdRkJmETfaQDwkq1VADnz1qU7JW9Ej7nf');
//         console.log('contractInstance', contractInstance);

//         // Call the createPool function directly, passing each field of the struct manually

//         const result = await contractInstance.createPool(
//             poolParams.tokens,      // address[2]
//             poolParams.amounts,      // uint256[2]
//             poolParams.proportions,  // uint256[2]
//             poolParams.threshold,    // uint256
//             poolParams.takeProfit,   // uint256[2]
//             poolParams.stopLoss,     // uint256[2]
//             poolParams.timePeriod    // uint256
//         ).send({
//             feeLimit: 1000000000, // Adjust the fee limit if necessary
//             callValue: 0
//         });

//         console.log("Pool created successfully:", result);







//     } catch (error) {
//         console.error("Error issss:", error);
//     }
// }
// const contract = await tronWeb.contract().at('TAdRkJmETfaQDwkq1VADnz1qU7JW9Ej7nf');

// createPool();


async function checkIsOperator(address) {
    try {
        // Call the isOperator function
        const result = await factoryContract.isOperator(address).call();
        // const result = await factoryContract.methods.isOperator(address).call();;
        console.log(`Is ${address} an operator?`, result);
    } catch (error) {
        console.error("Error calling isOperator:", error);
    }
}

const addressToCheck = "0xD13B85D23EFDEA60F8B84571254D6BBD7915CDE8"; // Example Tron Base58 address
checkIsOperator(addressToCheck);



