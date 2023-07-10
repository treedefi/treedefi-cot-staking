const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("UPGRADE Upgradable Staking Contract with the account:", deployer.address);
  const csProxy = "0x6DEd3663242fb19b7b2313D6fcce9A7ecf4e8a03";

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
