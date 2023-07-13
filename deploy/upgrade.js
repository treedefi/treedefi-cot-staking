const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("UPGRADE Upgradable Staking Contract with the account:", deployer.address);
  const csProxy = "0x37c66734e202c307851C63eDdb8A511cf5e11446";

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
