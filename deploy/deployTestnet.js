const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("TESTNET - Deploying Upgradable Staking Contract with the account:", deployer.address);

  const setContractAddress = "0x0FaB8A58793873f1E8adDe7B87065c8bd20d9096";
  const whitelistContractAddress = "0xa00f384c95B3507558316E10a9FD03f17700f2B3";
  const blockNumber = await ethers.provider.getBlockNumber();
  const blockStartNumber = 31867000 // TESTNET - estimated block number for Mon, 17 July 2023

  const poolSize = ethers.utils.parseEther("10000");
  const rewardRate = 10; // 20% per year APR (bnb chain) [15-20-25]
  const minStackingLockTime = 40; // 40 blocks = 2 minutes (bnb chain)
  const poolDuration = 10512000;  // 10512000 blocks = 1 year
  const maxStakePerUser = ethers.utils.parseEther("250"); // 250 COT
 

  const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStakingUpgradeable");
//   const COTStaking = await COTStakingInitializable.deploy();

  const csProxy = await upgrades.deployProxy(COTStakingInitializable, [setContractAddress, whitelistContractAddress, blockStartNumber, poolSize, rewardRate, minStackingLockTime, poolDuration, maxStakePerUser], { initializer: "initialize" });
  await csProxy.deployed();

  console.log("COTStakingUpgradeable deployed to:", csProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
