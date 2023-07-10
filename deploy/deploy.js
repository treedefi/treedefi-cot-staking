const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Upgradable Staking Contract with the account:", deployer.address);

  const cotContractAddress = "0xBfabDFEE039CC43d516f3D5eA88FbA9a4d7D12e9";
  const whitelistContractAddress = "0xa00f384c95B3507558316E10a9FD03f17700f2B3";

  const poolSize = ethers.utils.parseEther("10000");
  const rewardRate = 5; 
  const minStackingLockTime = 40; 
  const poolDuration = 432000; 
  const maxStakePerUser = ethers.utils.parseEther("250");

  const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStakingUpgradeable");
//   const COTStaking = await COTStakingInitializable.deploy();

  const csProxy = await upgrades.deployProxy(COTStakingInitializable, [cotContractAddress, whitelistContractAddress, poolSize, rewardRate, minStackingLockTime, poolDuration, maxStakePerUser], { initializer: "initialize" });
  await csProxy.deployed();

  console.log("COTStakingUpgradeable deployed to:", csProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
