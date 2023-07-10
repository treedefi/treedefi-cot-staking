require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-ethers");
require('hardhat-docgen');
require("dotenv").config();

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
  networks: {
    hardhat: {
      accounts: {
        initialBalance: "100000000000000000000000", // 10,000 Ether
      },
      chainId: 31337,
    },
    binanceTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: [privateKey],
      chainId: 97,
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
    },
    binanceMainnet: {
      url: "https://bsc-dataseed.binance.org",
      accounts: [privateKey],
      chainId: 56,
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {},
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {},
      },
    ],
  },
  abiExporter: {
    path: "./abi",
    clear: true,
    flat: true,
    spacing: 2
  },
  etherscanAbi: {
    artifactsDir: './artifacts',
    solcInput: 'solcInput.json',
    solcOutput: 'solcOutput.json'
  },
  docgen: {
    path: './docs',
    clear: true,
    //runOnCompile: true,
  }
};
