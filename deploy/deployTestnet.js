const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("TESTNET - Deploying Upgradable Staking Contract with the account:", deployer.address);

  const cotContractAddress = "0xBfabDFEE039CC43d516f3D5eA88FbA9a4d7D12e9";
  const whitelistContractAddress = "0xa00f384c95B3507558316E10a9FD03f17700f2B3";
  const blockNumber = await ethers.provider.getBlockNumber();
  const blockStartNumber = 31605150 // TESTNET - estimated block number for Sun Jul 16 2023 XXXX GMT+0200

  const poolSize = ethers.utils.parseEther("10000");
  const rewardRate = 20; // 20% per year APR (bnb chain)
  const minStackingLockTime = 40; // 40 blocks = 2 minutes (bnb chain)
  const poolDuration = 10512000;  // 10512000 blocks = 1 year
  const maxStakePerUser = ethers.utils.parseEther("250"); // 250 COT
 

  const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStakingUpgradeable");
//   const COTStaking = await COTStakingInitializable.deploy();

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
