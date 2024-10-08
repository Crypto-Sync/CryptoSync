import { TronWeb } from 'tronweb';
import fs from 'fs';
import poolContractABI from '../cryptosync-frontend/abis/poolContract.json' assert { type: 'json' };
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();

const tronWeb = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
    privateKey: process.env.PRIVATE_KEY,
});

const poolABI = poolContractABI.abi;


// Function to fetch all pools from the MongoDB API
async function getAllPools() {
  try {
    const response = await fetch('http://localhost:3000/api/pools/get-all-pools');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const pools = await response.json();
    // console.log(pools);
    return pools;
  } catch (error) {
    console.error('Error fetching pools from API:', error);
    return [];
  }
}

// Function to check and rebalance pools
async function checkAndRebalancePools() {
  try {
    const pools = await getAllPools();

    // Process pools one by one
    for (const pool of pools) {

      if(pool.poolAddress == null || pool.rebalancingFrequency != '120') {
        continue;
      } 
      // console.log("Pool in checkAndRebalance", pool);
      await checkAndRebalance(pool);
    }

  } catch (error) {
    console.error('Error in checkAndRebalancePools:', error);
  }
}

// Function to check and rebalance a single pool
async function checkAndRebalance(pool) {
  try {
    console.log("in CheckAndRebalance");
    const poolContract = await tronWeb.contract(poolABI, pool.poolAddress);

    // Fetch timePeriod and lastChecked
    const timePeriodHex = await poolContract.timePeriod().call();
    const lastCheckedHex = await poolContract.lastChecked().call();

    const timePeriod = parseInt(timePeriodHex._hex, 16);
    const lastChecked = parseInt(lastCheckedHex._hex, 16);

    const currentTime = Math.floor(Date.now() / 1000);

    // Check if rebalance is due
    // if (currentTime >= lastChecked + timePeriod) {
      console.log(`Rebalancing pool ${pool.poolAddress}`);

      // Fetch pool tokens
      const token0 = await poolContract.tokens(0).call();
      const token1 = await poolContract.tokens(1).call();

      // Combine the tokens into an array
      const tokens = [token0, token1];

      // Fetch before status
      const beforeStatus = await getPoolStatus(pool.poolAddress, tokens);

      console.log("beforeStatus : ", beforeStatus);

      // Call rebalance function
      const tx = await poolContract.rebalance().send({
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: true
      });

      // console.log(`Rebalanced pool ${pool.poolAddress}: ${tx}`);
      
      // Fetch after status
      const afterStatus = await getPoolStatus(pool.poolAddress, tokens);
      console.log("afterStatus : ", afterStatus);

       // Fetch the event from the transaction
       const events = await tronWeb.trx.getTransactionInfo(tx);
       let action = 'rebalance'; //change later
       if (events && events.log && events.log.length > 0) {
        const eventLog = events.log[0];
        const eventTopics = eventLog.topics;
        const eventSignatures = {
          rebalanceExecuted: tronWeb.sha3('RebalanceExecuted(address,address,uint256)'),
          takeProfitExecuted: tronWeb.sha3('TakeProfitExecuted(address,uint256)'),
          stopLossExecuted: tronWeb.sha3('StopLossExecuted(address,uint256,uint256)')
        };
      
        switch (eventTopics[0]) {
          case eventSignatures.rebalanceExecuted:
            action = 'rebalance';
            const [fromToken, toToken, amountToSwap] = tronWeb.utils.abi.decodeParams(['address', 'address', 'uint256'], eventLog.data);
            console.log(`Rebalance executed: from ${fromToken} to ${toToken}, amount: ${tronWeb.fromSun(amountToSwap)}`);
            break;
          case eventSignatures.takeProfitExecuted:
            action = 'takeProfit';
            const [tpToken, tpAmountConverted] = tronWeb.utils.abi.decodeParams(['address', 'uint256'], eventLog.data);
            console.log(`Take profit executed: token ${tpToken}, amount converted: ${tronWeb.fromSun(tpAmountConverted)}`);
            break;
          case eventSignatures.stopLossExecuted:
            action = 'stopLoss';
            const [slToken, slAmountConverted, slPrice] = tronWeb.utils.abi.decodeParams(['address', 'uint256', 'uint256'], eventLog.data);
            console.log(`Stop loss executed: token ${slToken}, amount converted: ${tronWeb.fromSun(slAmountConverted)}, price: ${tronWeb.fromSun(slPrice)}`);
            break;
        }
      }

      console.log("Action : ", action);

      // POST API for after status
      await postTransactionStatus(action, pool.poolAddress, pool.userWalletAddress, beforeStatus, afterStatus, "0x1232432432");
    // }
  } catch (error) {
    console.error(`Error processing pool ${pool.poolAddress}:`, error);
  }
}

async function getPoolStatus(poolAddress, tokens) {
  const status = [];
  let totalBalance = 0;

  // First pass: get balances and calculate total
  for (const token of tokens) {
    try {
      const contract = await tronWeb.contract().at(token);
      const balance = await contract.balanceOf(poolAddress).call();
      const symbol = await contract.symbol().call();
      const balanceInTRX = parseFloat(tronWeb.fromSun(balance.toString()));
      totalBalance += balanceInTRX;
      status.push({ symbol, balance: balanceInTRX });
    } catch (error) {
      console.error(`Error fetching balance for token ${token}:`, error);
      status.push({ symbol: token, balance: 0 });
    }
  }

  // Second pass: calculate percentages
  return status.map(item => ({
    tokenName: item.symbol,
    tokenPercentage: totalBalance > 0 ? (item.balance / totalBalance) * 100 : 0
  }));
}

// Updated function to post transaction status to the API
async function postTransactionStatus(action, poolAddress, userWalletAddress, beforeStatus, afterStatus, tx) {
  try {
      console.log("Post request : ", {
        type: action,
        txHash: tx,
        description: 'Automatic rebalancing completed',
        tokenBefore: beforeStatus,
        tokenAfter: afterStatus,
        amount: 0, // Set this to the appropriate value if needed
        userId: userWalletAddress, // Make sure to set this in your .env file
        poolId: poolAddress
      });

    const response = await axios.post('http://localhost:3000/api/pools/transactions/create', {
      type: action,
      txHash: tx,
      description: 'Automatic rebalancing completed',
      tokenBefore: beforeStatus,
      tokenAfter: afterStatus,
      amount: 0, // Set this to the appropriate value if needed
      userId: userWalletAddress, // Make sure to set this in your .env file
      poolId: poolAddress,
    });
    if (response.status === 201) {
      console.log(`Transaction status posted for rebalance:`, response.data);
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error posting transaction status for rebalance:`, error);
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