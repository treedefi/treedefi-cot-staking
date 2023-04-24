const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("COTStakingInitializable", function () {
  let RewardToken, StakedToken, COTStakingInitializable;
  let rewardToken, stakedToken, COTStaking;
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

    COTStakingInitializable = await ethers.getContractFactory("COTStakingInitializable");
    COTStaking = await COTStakingInitializable.deploy();
    // console.log("**HH** + COT Staking deployed!");

    // Transfer 1000 reward tokens to the smart contract
    await rewardToken.mint(COTStaking.address, ethers.utils.parseEther("1000"));

  
  });

  describe("Initialize", function () {
    it("should initialize the smart contract correctly with parameters", async () => {
       // Parameters for initialization
       const poolSize = ethers.utils.parseEther("500");
       const blockRewardRate = 10;
       const minStackingLockTime = 100;
       const poolDuration = 200;
     
       await COTStaking.initialize(
           stakedToken.address,
           poolSize,
           blockRewardRate,
           minStackingLockTime,
           poolDuration
       );

       expect(await COTStaking.cotToken()).to.equal(stakedToken.address);
       expect(await COTStaking.poolSize()).to.equal(poolSize);
       expect(await COTStaking.blockRewardRate()).to.equal(blockRewardRate);
       expect(await COTStaking.minStackingLockTime()).to.equal(minStackingLockTime);
       expect(await COTStaking.poolDuration()).to.equal(poolDuration);
       expect(await COTStaking.owner()).to.equal(owner.address);

     });
  });

  describe("Stake", function () {
    beforeEach(async () => {
        const poolSize = ethers.utils.parseEther("500");
        const blockRewardRate = 10;
        const minStackingLockTime = 100;
        const poolDuration = 200;

        await COTStaking.initialize(
            stakedToken.address,
            poolSize,
            blockRewardRate,
            minStackingLockTime,
            poolDuration
        );

        await stakedToken.transfer(user.address, ethers.utils.parseEther("1000"));
        await stakedToken.connect(user).approve(COTStaking.address, ethers.utils.parseEther("1000"));
    });

    it("should stake tokens successfully", async () => {
      const minStackingLockTime = 100;
      const stakeAmount = ethers.utils.parseEther("500");
      const blockNumberBeforeStake = await ethers.provider.getBlockNumber();
      await COTStaking.connect(user).stake(stakeAmount);

      const stakeInfo = await COTStaking.getUserStake(user.address);

      expect(stakeInfo.amount).to.equal(stakeAmount);
      expect(stakeInfo.startBlock).to.be.closeTo(blockNumberBeforeStake, 1); // Allow a difference of 1
      expect(stakeInfo.endBlock).to.be.closeTo(blockNumberBeforeStake + minStackingLockTime, 1); // Allow a difference of 1
      expect(stakeInfo.claimed).to.equal(false);

      const COTStakingBalance = await stakedToken.balanceOf(COTStaking.address);
      expect(COTStakingBalance).to.equal(stakeAmount);
    });
  });

describe("Unstake", function () {
  beforeEach(async () => {
    const poolSize = ethers.utils.parseEther("500");
    const blockRewardRate = 10;
    const minStackingLockTime = 100;
    const poolDuration = 200;
  
    await COTStaking.initialize(
        stakedToken.address,
        poolSize,
        blockRewardRate,
        minStackingLockTime,
        poolDuration
    );

    console.log("COTStaking initialized");

    // const initialStakedTokenBalance = await stakedToken.balanceOf(stakedToken.address);
    // console.log("Initial stakedToken balance:", ethers.utils.formatEther(initialStakedTokenBalance));

    // await stakedToken.transfer(user.address, ethers.utils.parseEther("5000"));
    // await stakedToken.connect(user).approve(COTStaking.address, ethers.utils.parseEther("5000"));

    // const userBalance = await stakedToken.balanceOf(user.address);
    // console.log("User balance after transfer:", ethers.utils.formatEther(userBalance));

    // const allowance = await stakedToken.allowance(user.address, COTStaking.address);
    // console.log("User allowance for COTStaking:", ethers.utils.formatEther(allowance));

    // const stakeAmount = ethers.utils.parseEther("100");
    // await COTStaking.connect(user).stake(stakeAmount);

    // const userStake = await COTStaking.getUserStake(user.address);
    // console.log("User stake amount:", ethers.utils.formatEther(userStake.amount));
  });

  it("should unstake tokens successfully", async () => {

  });
});


  describe("PendingReward", function () {

    it("should correctly calculate the pending reward", async () => {

    });
    // beforeEach(async () => {
    //   await COTStaking.initialize(
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
    //   await stakedToken.connect(user).approve(COTStaking.address, 1000);
    //   await COTStaking.connect(user).deposit(500);
    // });
      
      
  });
  
  describe("emergencyWithdraw", function () {
    // beforeEach(async () => {
    //   await COTStaking.initialize(
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
    //   await stakedToken.connect(user).approve(COTStaking.address, 1000);
    //   await COTStaking.connect(user).deposit(500);
    // });
  
    it("should allow emergency withdrawal", async () => {
      // await COTStaking.connect(user).emergencyWithdraw();
      // expect(await COTStaking.userInfo(user.address)).to.deep.equal([0, 0]);
    //   expect(await COTStaking.totalStaked()).to.equal(0);
    });
      

    
  });
  
});
