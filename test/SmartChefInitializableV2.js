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

    SmartChefInitializable = await ethers.getContractFactory("COTStakingInitializable");
    smartChef = await SmartChefInitializable.deploy();

    // Transfer 1000 reward tokens to the smart contract
  await rewardToken.mint(smartChef.address, ethers.utils.parseEther("1000"));

  
  });

  describe("initialize", function () {
    // it("should initialize the smart contract correctly", async () => {
    //   await smartChef.initialize(
    //     stakedToken.address,
    //     rewardToken.address,
    //     100,
    //     100,
    //     200,
    //     0,
    //     0,
    //     owner.address
    //   );

    //   expect(await smartChef.stakedToken()).to.equal(stakedToken.address);
    //   expect(await smartChef.rewardToken()).to.equal(rewardToken.address);
    //   expect(await smartChef.rewardPerBlock()).to.equal(100);
    //   expect(await smartChef.startBlock()).to.equal(100);
    //   expect(await smartChef.bonusEndBlock()).to.equal(200);
    //   expect(await smartChef.owner()).to.equal(owner.address);
    // });
  });

  describe("deposit", function () {
    // beforeEach(async () => {
    //   await smartChef.initialize(
    //     stakedToken.address,
    //     rewardToken.address,
    //     100,
    //     100,
    //     200,
    //     0,
    //     0,
    //     owner.address
    //   );
  
    //   await stakedToken.transfer(user.address, 1000);
    //   await stakedToken.connect(user).approve(smartChef.address, 1000);
    // });
  
    // it("should deposit tokens successfully", async () => {
    //   await smartChef.connect(user).deposit(500);
    //   expect(await smartChef.userInfo(user.address)).to.deep.equal([500, 0]);
    //   const smartChefBalance = await stakedToken.balanceOf(smartChef.address)
    //   expect(smartChefBalance == 500);
    // });
  });
  
  describe("withdraw", function () {
    beforeEach(async () => {
      // await smartChef.initialize(
      //   stakedToken.address,
      //   rewardToken.address,
      //   100,
      //   100,
      //   200,
      //   0,
      //   0,
      //   owner.address
      // );
  
      // await stakedToken.transfer(user.address, 1000);
      // await stakedToken.connect(user).approve(smartChef.address, 1000);
      // await smartChef.connect(user).deposit(500);
    });
  
    it("should withdraw tokens successfully", async () => {
      // await smartChef.connect(user).withdraw(250);
      // expect(await smartChef.userInfo(user.address)).to.deep.equal([250, 0]);
      // const smartChefBalance = await stakedToken.balanceOf(smartChef.address)
      // expect(smartChefBalance == 250);

    });
  });
  
  describe("pendingReward", function () {
    // beforeEach(async () => {
    //   await smartChef.initialize(
    //     stakedToken.address,
    //     rewardToken.address,
    //     100,
    //     100,
    //     200,
    //     0,
    //     0,
    //     owner.address
    //   );
  
    //   await stakedToken.transfer(user.address, 1000);
    //   await stakedToken.connect(user).approve(smartChef.address, 1000);
    //   await smartChef.connect(user).deposit(500);
    // });
      
      
  });
  
  describe("emergencyWithdraw", function () {
    // beforeEach(async () => {
    //   await smartChef.initialize(
    //     stakedToken.address,
    //     rewardToken.address,
    //     100,
    //     100,
    //     200,
    //     0,
    //     0,
    //     owner.address
    //   );
  
    //   await stakedToken.transfer(user.address, 1000);
    //   await stakedToken.connect(user).approve(smartChef.address, 1000);
    //   await smartChef.connect(user).deposit(500);
    // });
  
    it("should allow emergency withdrawal", async () => {
      // await smartChef.connect(user).emergencyWithdraw();
      // expect(await smartChef.userInfo(user.address)).to.deep.equal([0, 0]);
    //   expect(await smartChef.totalStaked()).to.equal(0);
    });

    it("should correctly calculate the pending reward", async () => {

      });
      

    
  });
  
});
