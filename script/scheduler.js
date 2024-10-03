require('dotenv').config();
const TronWeb = require('tronweb');

const tronWeb = new TronWeb({
  fullHost: process.env.FULL_NODE || 'https://api.trongrid.io',
  privateKey: process.env.PRIVATE_KEY,
});

const poolABI = require('./poolABI.json');
const poolFactoryABI = require('./poolFactoryABI.json');

const poolFactoryAddress = 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Replace with actual address
const poolFactoryContract = tronWeb.contract(poolFactoryABI, poolFactoryAddress);

// Function to fetch all pool addresses from PoolFactory
async function getAllPoolAddresses() {

    // TODO : Fetch from the mongoDB api instead of the contracts
  try {
    const poolCountHex = await poolFactoryContract.allPoolsLength().call();
    const poolCount = parseInt(poolCountHex._hex, 16);

    const poolAddresses = [];

    for (let i = 0; i < poolCount; i++) {
      const poolAddressHex = await poolFactoryContract.allPools(i).call();
      const poolAddress = tronWeb.address.fromHex(poolAddressHex);
      poolAddresses.push(poolAddress);
    }

    return poolAddresses;
  } catch (error) {
    console.error('Error fetching pool addresses:', error);
    return [];
  }
}  

// Function to check and rebalance pools
async function checkAndRebalancePools() {
  try {
    const poolAddresses = await getAllPoolAddresses();

    // Process pools one by one
    for (const poolAddress of poolAddresses) {
        await checkAndRebalance(poolAddress);
    }

  } catch (error) {
    console.error('Error in checkAndRebalancePools:', error);
  }
}

// Function to check and rebalance a single pool
async function checkAndRebalance(poolAddress) {
  try {
    const poolContract = await tronWeb.contract(poolABI, poolAddress);

    // Fetch timePeriod and lastChecked
    const timePeriodHex = await poolContract.timePeriod().call();
    const lastCheckedHex = await poolContract.lastChecked().call();

    const timePeriod = parseInt(timePeriodHex._hex, 16);
    const lastChecked = parseInt(lastCheckedHex._hex, 16);

    const currentTime = Math.floor(Date.now() / 1000);

    // Check if rebalance is due
    if (currentTime >= lastChecked + timePeriod) {
      console.log(`Rebalancing pool ${poolAddress}`);

      // Call rebalance function
      const tx = await poolContract.rebalance().send({
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: true
      });

      console.log(`Rebalanced pool ${poolAddress}: ${tx}`);
    } else {
      // Rebalance not due yet
      // console.log(`Pool ${poolAddress} does not need rebalancing at this time.`);
    }
  } catch (error) {
    console.error(`Error processing pool ${poolAddress}:`, error);
  }
}

// Function to run the continuous loop
async function startMonitoring() {
  // Define the interval in milliseconds (e.g., 1 minute)
  const INTERVAL_MS = 60 * 1000;

  while (true) {
    await checkAndRebalancePools();
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
