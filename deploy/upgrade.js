const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("UPGRADE Upgradable Staking Contract with the account:", deployer.address);
  const csProxy = "0x521Dd34Eba88692ab456F940619BB3F7AD315380";

  const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStakingUpgradeable");
  const csProxyUpgraded = await upgrades.upgradeProxy(csProxy, COTStakingInitializable);

  console.log("COTStakingUpgradeable upgraded to:", csProxyUpgraded.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
