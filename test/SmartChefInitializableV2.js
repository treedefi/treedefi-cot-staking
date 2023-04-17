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

     // Mint 1000 tokens each to the owner and user accounts
    await rewardToken.mint(owner.address, ethers.utils.parseEther("1000"));
    await stakedToken.mint(owner.address, ethers.utils.parseEther("1000"));
    await rewardToken.mint(user.address, ethers.utils.parseEther("1000"));
    await stakedToken.mint(user.address, ethers.utils.parseEther("1000"));

    SmartChefInitializable = await ethers.getContractFactory("contracts/SmartChefInitializableV2.sol:SmartChefInitializable");
    smartChef = await SmartChefInitializable.deploy();

    // Transfer 1000 reward tokens to the smart contract
  await rewardToken.mint(smartChef.address, ethers.utils.parseEther("1000"));

  
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

  describe("deposit", function () {
    beforeEach(async () => {
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
  
      await stakedToken.transfer(user.address, 1000);
      await stakedToken.connect(user).approve(smartChef.address, 1000);
    });
  
    it("should deposit tokens successfully", async () => {
      await smartChef.connect(user).deposit(500);
      expect(await smartChef.userInfo(user.address)).to.deep.equal([500, 0]);
      const smartChefBalance = await stakedToken.balanceOf(smartChef.address)
      expect(smartChefBalance == 500);
    });
  });
  
  describe("withdraw", function () {
    beforeEach(async () => {
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
  
      await stakedToken.transfer(user.address, 1000);
      await stakedToken.connect(user).approve(smartChef.address, 1000);
      await smartChef.connect(user).deposit(500);
    });
  
    it("should withdraw tokens successfully", async () => {
      await smartChef.connect(user).withdraw(250);
      expect(await smartChef.userInfo(user.address)).to.deep.equal([250, 0]);
      const smartChefBalance = await stakedToken.balanceOf(smartChef.address)
      expect(smartChefBalance == 250);

    });
  });
  
  describe("pendingReward", function () {
    beforeEach(async () => {
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
  
      await stakedToken.transfer(user.address, 1000);
      await stakedToken.connect(user).approve(smartChef.address, 1000);
      await smartChef.connect(user).deposit(500);
    });
      
      
  });
  
  describe("emergencyWithdraw", function () {
    beforeEach(async () => {
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
  
      await stakedToken.transfer(user.address, 1000);
      await stakedToken.connect(user).approve(smartChef.address, 1000);
      await smartChef.connect(user).deposit(500);
    });
  
    it("should allow emergency withdrawal", async () => {
      await smartChef.connect(user).emergencyWithdraw();
      expect(await smartChef.userInfo(user.address)).to.deep.equal([0, 0]);
    //   expect(await smartChef.totalStaked()).to.equal(0);
    });

    it("should correctly calculate the pending reward", async () => {
        // Perform the initial deposit
        await smartChef.connect(user).deposit(500);
      
        const initialBlockNumber = await ethers.provider.getBlockNumber();
        const rewardPerBlock = await smartChef.rewardPerBlock();
      
        // Increase the time and mine a block to reach the startBlock
        const startBlock = 100;
        const blocksToMine = startBlock - initialBlockNumber;
        const secondsToIncrease = blocksToMine * 15; // Assuming an average of 15 seconds per block
        await ethers.provider.send("evm_increaseTime", [secondsToIncrease]);
        await ethers.provider.send("evm_mine");
      
        // Mine blocks to reach the startBlock
        for (let i = initialBlockNumber; i < startBlock; i++) {
          await ethers.provider.send("evm_mine");
        }
      
        const currentBlockNumber = await ethers.provider.getBlockNumber();
        const newBlocksPassed = currentBlockNumber >= startBlock ? currentBlockNumber - startBlock + 1 : 0;
      
        const newExpectedReward = newBlocksPassed * rewardPerBlock;
      
        // Interact with the contract to trigger the reward distribution
        await smartChef.connect(user).deposit(1);
      
        // Get the new actual pending reward from the smart contract
        const newActualReward = await smartChef.pendingReward(user.address)
      
        // Add console.log statements to display relevant information
        console.log("Initial block number:", initialBlockNumber);
        console.log("Start block:", startBlock);
        console.log("Current block number:", await ethers.provider.getBlockNumber());
        console.log("New blocks passed:", newBlocksPassed);
        console.log("Expected reward:", newExpectedReward.toString());
        console.log("Actual reward:", newActualReward.toString());
      
        // Compare the new expected reward with the new actual reward
        expect(newActualReward).to.equal(newExpectedReward);
      });
      

    
  });
  
});
