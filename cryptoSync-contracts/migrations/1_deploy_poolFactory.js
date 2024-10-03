const PoolFactory = artifacts.require("PoolFactory");

module.exports = async function (deployer) {
  try {
    console.log('Starting deployment...');

    // Now deploy the PoolFactory
    console.log('Deploying PoolFactory...');
    await deployer.deploy(PoolFactory);
    const poolFactoryInstance = await PoolFactory.deployed();
    console.log('PoolFactory deployed successfully at:', poolFactoryInstance.address);

    return poolFactoryInstance;
  } catch (error) {
    console.error('Error during migration:', error);
    console.error('Error stack:', error.stack);

    // If the error is an AggregateError, print out all individual errors
    if (error instanceof AggregateError) {
      for (const individualError of error.errors) {
        console.error('Individual error:', individualError);
      }
    }

    throw error;
  }
};
