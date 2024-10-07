const PoolFactory = artifacts.require("PoolFactory");

module.exports = async function (deployer) {
  try {
    console.log('Starting deployment...');

    // Deploy the PoolFactory
    console.log('Deploying PoolFactory...');
    await deployer.deploy(PoolFactory);

    // Wait for the contract to be deployed
    const poolFactoryInstance = await PoolFactory.deployed();

    console.log('PoolFactory deployed successfully at:', poolFactoryInstance.address);

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
