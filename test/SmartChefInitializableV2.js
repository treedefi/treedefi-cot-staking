const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("SmartChefInitializable", function () {
  let RewardToken, StakedToken, SmartChefInitializable;
  let rewardToken, stakedToken, smartChef;
  let owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    RewardToken = await ethers.getContractFactory("ERC20Mock");
    rewardToken = await RewardToken.deploy("Reward Token", "RWD");

    StakedToken = await ethers.getContractFactory("ERC20Mock");
    stakedToken = await StakedToken.deploy("Staked Token", "STK");

    SmartChefInitializable = await ethers.getContractFactory("contracts/SmartChefInitializableV2.sol:SmartChefInitializable");
    smartChef = await SmartChefInitializable.deploy();
  });

  describe("initialize", function () {
    it("should initialize the smart contract correctly", async () => {
      await smartChef.initialize(
        stakedToken.address,
        rewardToken.address,
        100,
        100,
        200,
        0,
        0,
        owner.address
      );

      expect(await smartChef.stakedToken()).to.equal(stakedToken.address);
      expect(await smartChef.rewardToken()).to.equal(rewardToken.address);
      expect(await smartChef.rewardPerBlock()).to.equal(100);
      expect(await smartChef.startBlock()).to.equal(100);
      expect(await smartChef.bonusEndBlock()).to.equal(200);
      expect(await smartChef.owner()).to.equal(owner.address);
    });
  });

  // Add more test cases for other functions like deposit, withdraw, etc.
});
