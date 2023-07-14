const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("MAINNET- Deploying Upgradable Staking Contract with the account:", deployer.address);

  const cotContractAddress = "0x56B37783f1847997242A7b181f9F50A680319Cc5";
  const whitelistContractAddress = "0x90FAb7F9B9e70ff4B992297E7670a28479FaCD36";
  const blockStartNumber = 30043000 // estimated block number for Mon Jul 17 2023 15:19:50 GMT+0200

  const poolSize = ethers.utils.parseEther("100000"); //100K COT
  const rewardRate = 20; // 20% per year APR (bnb chain)
  const minStackingLockTime = 876000; // 876000 blocks = 1 month (bnb chain)
  const poolDuration = 10512000;  // 10512000 blocks = 1 year
  const maxStakePerUser = ethers.utils.parseEther("10000"); // 10K COT per user 
 

  const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStakingUpgradeable");
  // const COTStaking = await COTStakingInitializable.deploy();

  const csProxy = await upgrades.deployProxy(COTStakingInitializable, [cotContractAddress, whitelistContractAddress, blockStartNumber, poolSize, rewardRate, minStackingLockTime, poolDuration, maxStakePerUser], { initializer: "initialize" });
  await csProxy.deployed();

  console.log("COTStakingUpgradeable deployed to:", csProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
