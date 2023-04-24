const { ethers } = require("hardhat");
const { expect } = require("chai");

async function setup() {
  const [owner, user] = await ethers.getSigners();

  const RewardToken = await ethers.getContractFactory("ERC20Mock");
  const rewardToken = await RewardToken.deploy("Reward Token", "RWD");

  const StakedToken = await ethers.getContractFactory("ERC20Mock");
  const stakedToken = await StakedToken.deploy("Staked Token", "STK");

  // Mint 1000 tokens each to the owner and user accounts
  await rewardToken.mint(owner.address, ethers.utils.parseEther("1000"));
  await stakedToken.mint(owner.address, ethers.utils.parseEther("1000"));
  await rewardToken.mint(user.address, ethers.utils.parseEther("1000"));
  await stakedToken.mint(user.address, ethers.utils.parseEther("1000"));

  const COTStakingInitializable = await ethers.getContractFactory("COTStakingInitializable");
  const COTStaking = await COTStakingInitializable.deploy();

  // Transfer 1000 reward tokens to the smart contract
  await rewardToken.mint(COTStaking.address, ethers.utils.parseEther("1000"));

  // Initialize the staking contract
  const poolSize = ethers.utils.parseEther("500");
  const rewardRate = 10;
  const minStackingLockTime = 100;
  const poolDuration = 200;

  await COTStaking.initialize(
    stakedToken.address,
    poolSize,
    rewardRate,
    minStackingLockTime,
    poolDuration
  );

  await stakedToken.transfer(user.address, ethers.utils.parseEther("1000"));
  await stakedToken.connect(user).approve(COTStaking.address, ethers.utils.parseEther("1000"));

  return {
    owner,
    user,
    rewardToken,
    stakedToken,
    COTStaking,
    poolSize,
    rewardRate,
    minStackingLockTime,
    poolDuration,
  };
}

describe("COTStakingInitializable", function () {
  let fixtures;

  beforeEach(async () => {
    fixtures = await setup();
  });

  describe("Initialize", function () {
    it("should initialize the smart contract correctly with parameters", async () => {
      expect(await fixtures.COTStaking.cotToken()).to.equal(fixtures.stakedToken.address);
      expect(await fixtures.COTStaking.poolSize()).to.equal(fixtures.poolSize);
      expect(await fixtures.COTStaking.rewardRate()).to.equal(fixtures.rewardRate);
      expect(await fixtures.COTStaking.minStackingLockTime()).to.equal(fixtures.minStackingLockTime);
      expect(await fixtures.COTStaking.poolDuration()).to.equal(fixtures.poolDuration);
      expect(await fixtures.COTStaking.owner()).to.equal(fixtures.owner.address);
    });
  });

  describe("Stake", function () {
    it("should stake tokens successfully", async () => {
      const stakeAmount = ethers.utils.parseEther("500");
      const blockNumberBeforeStake = await ethers.provider.getBlockNumber();
      await fixtures.COTStaking.connect(fixtures.user).stake(stakeAmount);
  
      const stakeInfo = await fixtures.COTStaking.getUserStake(fixtures.user.address);
  
      expect(stakeInfo.amount).to.equal(stakeAmount);
      expect(stakeInfo.startBlock).to.be.closeTo(blockNumberBeforeStake, 1); // Allow a difference of 1
      expect(stakeInfo.endBlock).to.be.closeTo(blockNumberBeforeStake + fixtures.minStackingLockTime, 1); // Allow a difference of 1
      expect(stakeInfo.claimed).to.equal(false);
  
      const COTStakingBalance = await fixtures.stakedToken.balanceOf(fixtures.COTStaking.address);
      expect(COTStakingBalance).to.equal(stakeAmount);
    });
  });

  describe("PendingReward", function () {
    it("should correctly calculate the pending reward after advancing some blocks", async function () {
      const amountToStake = ethers.utils.parseEther("10");
  
      await fixtures.stakedToken.approve(fixtures.COTStaking.address, amountToStake);
      await fixtures.COTStaking.connect(fixtures.user).stake(amountToStake);

      const blockToAdvance = 5;
      const expectedReward = amountToStake.mul(fixtures.rewardRate).mul(blockToAdvance).div(fixtures.poolDuration).div(100);
  
      console.log(`Amount to stake: ${amountToStake}`);
      console.log(`Reward rate: ${fixtures.rewardRate}`);
      console.log(`Blocks to advance: ${blockToAdvance}`);
      console.log(`Pool duration: ${fixtures.poolDuration}`);
      console.log(`Expected reward: ${expectedReward}`);
  
      for (let i = 0; i < blockToAdvance; i++) {
        await network.provider.send("evm_mine");
      }
  
      const pendingRewards = await fixtures.COTStaking.userPendingRewards(fixtures.user.address);
  
      console.log(`Pending rewards: ${pendingRewards}`);
      expect(pendingRewards).to.be.equal(expectedReward);

    });
  });

  
  
    
  
});  
  
