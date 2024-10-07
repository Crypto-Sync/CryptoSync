import { TronWeb } from 'tronweb';
import fs from 'fs';
import dotenv from "dotenv";
dotenv.config();

// Read the ABI and network configurations
const contractJson = JSON.parse(fs.readFileSync('./build/contracts/PoolFactory.json', 'utf8'));
const abi = contractJson.abi;

const poolFactoryAddress = "TAdRkJmETfaQDwkq1VADnz1qU7JW9Ej7nf";

const privateKey = process.env.PRIVATE_KEY;
// const tronWeb = new TronWeb({
//   fullHost: 'https://nile.trongrid.io',
//   headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
//   privateKey
// });
const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  privateKey
});
console.log('tronWeb', tronWeb);

const params = [
  ['TWYiT6zVWEH8gkp14YSPTyTjt8MXNbvVud', 'TUQJvMCiPfaYLDyQg8cKkK64JSkUVZh4qq'],
  ['100000000000000000000', '100000000000000000000'],
  ['5000', '5000'],
  '1000',
  ['10500', '10500'],
  ['1000000', '50000'],
  '86400'
];

// Example approval script (run this before creating pool)
const approveTokens = async () => {
  for (const tokenAddress of params[0]) {
    const tokenContract = await tronWeb.contract().at(tokenAddress);
    await tokenContract.approve(
      poolFactoryAddress,
      '115792089237316195423570985008687907853269984665640564039457584007913129639935' // Max approval
    ).send();
  }
};

const createPool = async () => {
  try {
    console.log('Starting script...');

    // Getting contract instance of PoolFactory
    const poolFactoryContract = await tronWeb.contract(abi, poolFactoryAddress);
    console.log('Contract instantiated at address:', poolFactoryAddress);

    // approveTokens();


    const tx = await poolFactoryContract.createPool(params).send({
      feeLimit: 1000 * 1e6,
      callValue: 0
    });

    console.log('Pool created successfully, transaction ID:', tx);
    process.exit(0);
  } catch (error) {
    console.error('Error creating pool:', error);
    process.exit(1);
  }
};

createPool();
