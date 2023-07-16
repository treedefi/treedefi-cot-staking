const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("UPGRADE Upgradable Staking Contract with the account:", deployer.address);
  const csProxy = "0x36e7b7806bBc9B5aE648446910a5C75499900fcd";

  const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStakingUpgradeableV2");
  const csProxyUpgraded = await upgrades.upgradeProxy(csProxy, COTStakingInitializable);

  console.log("COTStakingUpgradeable upgraded to:", csProxyUpgraded.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
