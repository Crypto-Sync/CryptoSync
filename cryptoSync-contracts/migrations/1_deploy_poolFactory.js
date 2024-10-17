const PoolFactory = artifacts.require("PoolFactory");
const TronWeb = require('tronweb');

module.exports = async function (deployer, network) {
  try {
    console.log('Starting deployment on Nile testnet...');

    const sunswapFactoryAddress = "TTpBzG9ZCExRTxWpy5AeEsoJxH8u9wdq9D";

    // Deploy the PoolFactory with constructor parameter
    console.log('Deploying PoolFactory...');
    await deployer.deploy(PoolFactory, sunswapFactoryAddress);

    // Get the deployed contract instance
    const poolFactoryInstance = await PoolFactory.deployed();
    console.log('PoolFactory deployed successfully at:', poolFactoryInstance.address);
    
    // Call setPoolAddresses
    console.log('Setting pool addresses...');
    await poolFactoryInstance.setPoolAddresses();
    
    console.log('Pool addresses set successfully');

    return poolFactoryInstance;
  } catch (error) {
    console.error('Error during migration:', error);

    if (error instanceof AggregateError) {
      for (const individualError of error.errors) {
        console.error('Individual error:', individualError);
      }
    }

    throw error;
  }
};