const { ethers } = require("hardhat");
const { expect } = require("chai");

async function setup() {
  const [owner, user] = await ethers.getSigners();
  const StakedToken = await ethers.getContractFactory("ERC20Mock");
  const stakedToken = await StakedToken.deploy("Staked Token", "STK");

  // Mint 1000 tokens each to the owner and user accounts
  await stakedToken.mint(owner.address, ethers.utils.parseEther("1000"));
  await stakedToken.mint(user.address, ethers.utils.parseEther("1000"));

  const COTStakingInitializable = await ethers.getContractFactory("COTStakingInitializable");
  const COTStaking = await COTStakingInitializable.deploy();

  // Initialize the staking contract
  const poolSize = ethers.utils.parseEther("1000");
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
    stakedToken,
    COTStaking,
    poolSize,
    rewardRate,
    minStackingLockTime,
    poolDuration,
  };
}

    /* HELPER FUNCTIONS 
    * This functions are exstensively used in the code
    * 
    */
async function advanceBlocks(blockCount) {
    for (let i = 0; i < blockCount; i++) {
      await network.provider.send("evm_mine");
    }
  }
  
  function calculateExpectedReward(stakeAmount, rewardRate, blockCount, poolDuration) {
    return stakeAmount.mul(rewardRate).mul(blockCount).div(poolDuration).div(100);
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

  
      const COTStakingBalance = await fixtures.stakedToken.balanceOf(fixtures.COTStaking.address);
      expect(COTStakingBalance).to.equal(stakeAmount);
    });

    it("should stake tokens again successfully", async () => {
        const stakeAmount = ethers.utils.parseEther("500");
        const blockNumberBeforeStake = await ethers.provider.getBlockNumber();
        await fixtures.COTStaking.connect(fixtures.user).stake(stakeAmount);
    
        const stakeInfo = await fixtures.COTStaking.getUserStake(fixtures.user.address);
    
        expect(stakeInfo.amount).to.equal(stakeAmount);
        expect(stakeInfo.startBlock).to.be.closeTo(blockNumberBeforeStake, 1); // Allow a difference of 1
        expect(stakeInfo.endBlock).to.be.closeTo(blockNumberBeforeStake + fixtures.minStackingLockTime, 1); // Allow a difference of 1

    
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
    
      for (let i = 0; i < blockToAdvance; i++) {
        await network.provider.send("evm_mine");
      }
      

      const pendingRewards = await fixtures.COTStaking.userPendingRewards(fixtures.user.address);
      expect(pendingRewards).to.be.equal(expectedReward);

    });
  });

  describe("Unstake", function () {

    it("should unstake tokens and claim rewards successfully", async () => {

        // mint and transfer 1500 COT to the smart contract
        const rewardAmount = ethers.utils.parseEther("1500");
        await fixtures.stakedToken.mint(fixtures.COTStaking.address, rewardAmount);

        // stake 500 Cot to the smart contract
        const stakeAmount = ethers.utils.parseEther("500");
        await fixtures.stakedToken.approve(fixtures.COTStaking.address, stakeAmount);
        await fixtures.COTStaking.connect(fixtures.user).stake(stakeAmount);
    
        // Get the user's initial COT token balance before staking
        const userInitialBalance = await fixtures.stakedToken.balanceOf(fixtures.user.address);
        const stakeInfo = await fixtures.COTStaking.getUserStake(fixtures.user.address);

        // advance 110 blocks (TODO: advance the necessary blocks to execute the unstake function)
        // NOTE: when executing unstaking it will increase one additional block!!
        const blockToAdvance = 110;
        for (let i = 0; i < blockToAdvance; i++) {
          await network.provider.send("evm_mine");
        }

        // compute expected reward (NOTE: we added 1 more block to compute it correctly)
        const expectedReward = stakeAmount.mul(fixtures.rewardRate).mul(blockToAdvance+1).div(fixtures.poolDuration).div(100);

        // execute unstake function
        await fixtures.COTStaking.connect(fixtures.user).unstake();
        const userFinalBalance = await fixtures.stakedToken.balanceOf(fixtures.user.address);
        const diffBalance = userFinalBalance.sub(userInitialBalance);

        // the updated balance (amount got from the SC) should be equal to saked amount + expected Reward
        expect(diffBalance).to.be.equal(stakeAmount.add(expectedReward));

        
      });
    it("should revert if the user has not staked yet", async () => {
      await expect(fixtures.COTStaking.connect(fixtures.user).unstake()).to.be.revertedWith("COTStaking: No active stake");
    });
    

    it("should revert if the minimum staking lock time is not reached", async () => {
      const stakeAmount = ethers.utils.parseEther("500");
      await fixtures.stakedToken.approve(fixtures.COTStaking.address, stakeAmount);
      await fixtures.COTStaking.connect(fixtures.user).stake(stakeAmount);
  
      await expect(fixtures.COTStaking.connect(fixtures.user).unstake()).to.be.revertedWith(
        "COTStaking: Minimum staking lock time not reached"
      );
    });
  
  });

  describe("Restaking and rewards", function () {

    it("should update endBlock correctly when staking more tokens after the initial stake", async () => {
        const minStakingLockingTime = fixtures.minStackingLockTime;

        // First stake
        const stakeAmount1 = ethers.utils.parseEther("500");
        await fixtures.COTStaking.connect(fixtures.user).stake(stakeAmount1);

        const initialBlockNumber = await ethers.provider.getBlockNumber();
      
        // Advance some blocks (half)
        const blocksToAdvance = 50;
        for (let i = 0; i < blocksToAdvance; i++) {
          await network.provider.send("evm_mine");
        }

        
        const stakeAmount2 = ethers.utils.parseEther("250");
        var secondStakeInfo = await fixtures.COTStaking.getUserStake(fixtures.user.address);
        var userRewards = await fixtures.COTStaking.userPendingRewards(fixtures.user.address);

        const pendingRewards = await fixtures.COTStaking.userPendingRewards(fixtures.user.address);
        // console.log("Current reward: " + userRewards);
        await fixtures.COTStaking.connect(fixtures.user).stake(stakeAmount2);
        secondStakeInfo = await fixtures.COTStaking.getUserStake(fixtures.user.address);
        const currentEndBlock =  secondStakeInfo.endBlock;
        

        expect(initialBlockNumber + blocksToAdvance+1 + minStakingLockingTime ).to.equal(currentEndBlock);
        

      });

      it("should correctly unstake and compute rewards after staking multiple times", async () => {

        // transfer and mint 1500 tokens
        const rewardAmount = ethers.utils.parseEther("1500");
        await fixtures.stakedToken.mint(fixtures.COTStaking.address, rewardAmount);
 
        // user initial balance of COT
        const userInitialBalance = await fixtures.stakedToken.balanceOf(fixtures.user.address);
        var blockNumber = await ethers.provider.getBlockNumber();

        // first stake of 500 COT
        const firstStakeAmount = ethers.utils.parseEther("500");
        await fixtures.stakedToken.approve(fixtures.COTStaking.address, firstStakeAmount);
        await fixtures.COTStaking.connect(fixtures.user).stake(firstStakeAmount);
        blockNumber = await ethers.provider.getBlockNumber();


        const firstBlocksToAdvance = 50;
        for (let i = 0; i < firstBlocksToAdvance; i++) {
          await network.provider.send("evm_mine");
        }
        
        // pending rewards from the first staking action
        var pendingRewards = await fixtures.COTStaking.userPendingRewards(fixtures.user.address);
        var expectedFirstRewards = firstStakeAmount.mul(fixtures.rewardRate).mul(firstBlocksToAdvance).div(fixtures.poolDuration).div(100);
        expect (expectedFirstRewards).to.equal(pendingRewards);
        blockNumber = await ethers.provider.getBlockNumber();

        // second stake 250 more COT after advancing blocks
        const secondStakeAmount = ethers.utils.parseEther("250");
        await fixtures.COTStaking.connect(fixtures.user).stake(secondStakeAmount);
        blockNumber = await ethers.provider.getBlockNumber();


        // we adjust this first rewards because the staking action
        expectedFirstRewards = firstStakeAmount.mul(fixtures.rewardRate).mul(firstBlocksToAdvance+1).div(fixtures.poolDuration).div(100);

         // pending rewards after second action
        pendingRewards = await fixtures.COTStaking.userPendingRewards(fixtures.user.address);
        blockNumber = await ethers.provider.getBlockNumber();
        var userInfo = await fixtures.COTStaking.getUserStake(fixtures.user.address);

        const secondBlocksToAdvance = 110;
        for (let i = 0; i < secondBlocksToAdvance; i++) {
          await network.provider.send("evm_mine");
        }

        // pending rewards after second action
        pendingRewards = await fixtures.COTStaking.userPendingRewards(fixtures.user.address);
        blockNumber = await ethers.provider.getBlockNumber();
        userInfo = await fixtures.COTStaking.getUserStake(fixtures.user.address);

        // unstake action
        await fixtures.COTStaking.connect(fixtures.user).unstake();
        // const passedBlocks = firstBlocksToAdvance + secondBlocksToAdvance;
        

        // pending rewards after unstaking
        pendingRewards = await fixtures.COTStaking.userPendingRewards(fixtures.user.address);
        blockNumber = await ethers.provider.getBlockNumber();
        
 
        const stakingSum = firstStakeAmount.add(secondStakeAmount);
        const expectedSecondRewards = stakingSum.mul(fixtures.rewardRate).mul(secondBlocksToAdvance+1).div(fixtures.poolDuration).div(100);
        const totalRewards = expectedSecondRewards.add(expectedFirstRewards);


        // user final balance of COT
        const userFinalBalance = await fixtures.stakedToken.balanceOf(fixtures.user.address);
        const diff = userFinalBalance.sub(userInitialBalance);
        expect (diff).to.equal(totalRewards);

        
    });
    
      
      
      
  });

  
  
    
  
});  
  
