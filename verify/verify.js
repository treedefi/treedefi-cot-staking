const hre = require("hardhat");
const ethers = hre.ethers;
const { utils } = require("ethers");

const STAKING_PROXY_ADDRESS = "0x37c66734e202c307851C63eDdb8A511cf5e11446"; // change with mainnet one!

const { defaultAbiCoder, keccak256, solidityPack } = require("ethers/lib/utils");

  async function getImplementationAddress(proxyAddress) {
    const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const storageValue = await ethers.provider.getStorageAt(proxyAddress, implementationSlot);
    return "0x" + storageValue.slice(-40);
  }

async function main() {
  const network = await hre.ethers.provider.getNetwork();
  console.log("Connected to network:", network.name);
  console.log("Chain ID:", network.chainId);

  const contractName = "contracts/dist/TreedefiCOTStakingUpgradeable.sol:TreedefiCOTStakingUpgradeable"

  try {
     // get the contract factory
  const Contract = await ethers.getContractFactory(contractName);

  const contractImplementation = await getImplementationAddress(STAKING_PROXY_ADDRESS);
  console.log("Contract Proxy address:", STAKING_PROXY_ADDRESS);
  console.log("Contract Implementation address:", contractImplementation);

  // verify the contract
  await hre.run("verify:verify", {
    address: contractImplementation,
    contract: contractName,
  });

  } catch (error) {
    console.error("Error during verification:", error.message);
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
