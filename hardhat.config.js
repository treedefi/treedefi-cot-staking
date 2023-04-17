require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.4",
        settings: {},
      },
      {
        version: "0.8.17",
        settings: {},
      },
    ],
  },
};