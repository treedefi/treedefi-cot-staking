const { ethers } = require("hardhat");
const { expect } = require("chai");

async function setup() {
  const [owner, user] = await ethers.getSigners();
  const StakedToken = await ethers.getContractFactory("ERC20Mock");
  const stakedToken = await StakedToken.deploy("Staked Token", "STK");

  // Mint 1000 tokens each to the owner and user accounts
  await stakedToken.mint(owner.address, ethers.utils.parseEther("10000"));
  await stakedToken.mint(user.address, ethers.utils.parseEther("10000"));

  // Deploy the whitelist contract
  const TreedefiWthitelistInitializable = await ethers.getContractFactory("TreedefiWhitelist");
  const treedefiWhitelist = await TreedefiWthitelistInitializable.deploy();

  // Initialize the whitelist contract
  await treedefiWhitelist.addToWhitelist([owner.address]);

    // Initialize the staking contract
    const poolSize = ethers.utils.parseEther("10000");
    const rewardRate = 10;
    const minStakingLockTime = 100;
    const poolDuration = 200;
    const maxStakePerUser = ethers.utils.parseEther("5000");

  const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStakingUpgradeable");
  const COTStaking = await COTStakingInitializable.deploy();
  
  // To deploy our Proxy, we just have to call upgrades.deployProxy() and await
  // its deployed() method, which happens once its transaction has been
  // mined.

  const csProxy = await upgrades.deployProxy(COTStakingInitializable, [stakedToken.address, treedefiWhitelist.address, poolSize, rewardRate, minStakingLockTime, poolDuration, maxStakePerUser], { initializer: "initialize" });
  await csProxy.deployed();

  await stakedToken.transfer(user.address, ethers.utils.parseEther("1000"));
  await stakedToken.connect(user).approve(csProxy.address, ethers.utils.parseEther("1000"));
  const poolRewardEndBlock = await csProxy.poolRewardEndBlock;

  return {
    owner,
    user,
    stakedToken,
    COTStakingInitializable,
    COTStaking,
    csProxy,
    treedefiWhitelist,
    poolSize,
    rewardRate,
    minStakingLockTime,
    poolDuration,
    poolRewardEndBlock,
    maxStakePerUser
  };
}

describe("Treedefi COT Staking Upgradable - Tests ", function () {
    let fixtures;
  
    beforeEach(async () => {
      fixtures = await setup();
    });

    describe("Initialize", function () {
        it("should initialize the smart contract correctly with given parameters", async () => {
          const blockNumber = await ethers.provider.getBlockNumber();
          const endBlock = fixtures.poolDuration + blockNumber;
    
          expect(await fixtures.csProxy.cotToken()).to.equal(fixtures.stakedToken.address);
          expect(await fixtures.csProxy.whitelist()).to.equal(fixtures.treedefiWhitelist.address);
          expect(await fixtures.csProxy.poolSize()).to.equal(fixtures.poolSize);
          expect(await fixtures.csProxy.rewardRate()).to.equal(fixtures.rewardRate);
          expect(await fixtures.csProxy.minStakingLockTime()).to.equal(fixtures.minStakingLockTime);
          expect(await fixtures.csProxy.poolDuration()).to.equal(fixtures.poolDuration);
          expect(await fixtures.csProxy.maxStakePerUser()).to.equal(fixtures.maxStakePerUser);
          // expect(await fixtures.csProxy.owner()).to.equal(fixtures.owner.address);
          
          // allow 2 blocks tolerance
          expect(await fixtures.csProxy.poolRewardEndBlock()).to.be.closeTo(endBlock,2);
    
        });
        
      });

      describe("Stake", function () {
        it("should stake tokens successfully", async () => {
          const stakeAmount = ethers.utils.parseEther("500");
          const blockNumberBeforeStake = await ethers.provider.getBlockNumber();
          await fixtures.csProxy.connect(fixtures.user).stake(stakeAmount);
      
          const stakeInfo = await fixtures.csProxy.getUserStake(fixtures.user.address);
      
          expect(stakeInfo.amount).to.equal(stakeAmount);
          expect(stakeInfo.startBlock).to.be.closeTo(blockNumberBeforeStake, 1); // Allow a difference of 1
          expect(stakeInfo.endBlock).to.be.closeTo(blockNumberBeforeStake + fixtures.minStakingLockTime, 1); // Allow a difference of 1
    
      
          const COTStakingBalance = await fixtures.stakedToken.balanceOf(fixtures.csProxy.address);
          expect(COTStakingBalance).to.equal(stakeAmount);
        });

        it("should fail to stake tokens because user is not whitelisted", async () => {
          // Enable whitelisting
          await fixtures.csProxy.connect(fixtures.owner).toggleWhitelist();
        
          // Attempt to stake tokens
          const stakeAmount = ethers.utils.parseEther("500");
          
          await expect(fixtures.csProxy.connect(fixtures.user).stake(stakeAmount)).to.be.revertedWith("COTStaking: user is not whitelisted");
        
          // Check that no tokens were staked
          const stakeInfo = await fixtures.csProxy.getUserStake(fixtures.user.address);
        
          expect(stakeInfo.amount).to.equal(0);
        
          const COTStakingBalance = await fixtures.stakedToken.balanceOf(fixtures.csProxy.address);
          expect(COTStakingBalance).to.equal(0);
        });
        
    
        it("should stake tokens again successfully", async () => {
            const stakeAmount = ethers.utils.parseEther("500");
            const blockNumberBeforeStake = await ethers.provider.getBlockNumber();
            await fixtures.csProxy.connect(fixtures.user).stake(stakeAmount);
        
            const stakeInfo = await fixtures.csProxy.getUserStake(fixtures.user.address);
        
            expect(stakeInfo.amount).to.equal(stakeAmount);
            expect(stakeInfo.startBlock).to.be.closeTo(blockNumberBeforeStake, 1); // Allow a difference of 1
            expect(stakeInfo.endBlock).to.be.closeTo(blockNumberBeforeStake + fixtures.minStakingLockTime, 1); // Allow a difference of 1
    
        
            const COTStakingBalance = await fixtures.stakedToken.balanceOf(fixtures.csProxy.address);
            expect(COTStakingBalance).to.equal(stakeAmount);
          });
    
          it("should correctly compute the user stake capacity", async () => {
            const stakeAmount = ethers.utils.parseEther("500");
            await fixtures.csProxy.connect(fixtures.user).stake(stakeAmount);
        
            const expectedUserCapacity =  await fixtures.maxStakePerUser.sub(stakeAmount);
            const userCapacity = await fixtures.csProxy.getRemainingUserStakeCapacity(fixtures.user.address);
            
            expect (userCapacity).to.equal(expectedUserCapacity);
        
          });

          
      });

      describe("PendingReward", function () {
        it("should correctly calculate the pending reward after advancing some blocks", async function () {
          const amountToStake = ethers.utils.parseEther("10");
      
          await fixtures.stakedToken.approve(fixtures.csProxy.address, amountToStake);
          await fixtures.csProxy.connect(fixtures.user).stake(amountToStake);
    
          const blockToAdvance = 5;
          const expectedReward = amountToStake.mul(fixtures.rewardRate).mul(blockToAdvance).div(fixtures.poolDuration).div(100);
    
          for (let i = 0; i < blockToAdvance; i++) {
            await network.provider.send("evm_mine");
          }
    
          const pendingRewards = await fixtures.csProxy.userPendingRewards(fixtures.user.address);
          expect(pendingRewards).to.be.equal(expectedReward);
          
        
        });
    
        it("should not increase rewards after pool ends", async function () {
    
          // stake tokens
          const amountToStake = ethers.utils.parseEther("250");
          await fixtures.stakedToken.approve(fixtures.csProxy.address, amountToStake);
          await fixtures.csProxy.connect(fixtures.user).stake(amountToStake);
    
          // compute last reward block
          const poolRewardEndBlock = await fixtures.csProxy.poolRewardEndBlock();
    
          // get current block 
          const currentBlockNumber = await ethers.provider.getBlockNumber();
    
          // compute rewards after pool ends
          const diffBlocks = poolRewardEndBlock.sub(currentBlockNumber);
          const expectedReward = amountToStake.mul(fixtures.rewardRate).mul(diffBlocks).div(fixtures.poolDuration).div(100);
    
          for (let i = 0; i < diffBlocks+5; i++) {
            await network.provider.send("evm_mine");
          }
    
          const pendingRewards = await fixtures.csProxy.userPendingRewards(fixtures.user.address);
          expect(pendingRewards).to.be.equal(expectedReward);
          
        
        });
      });

      describe("Unstake", function () {

        it("should unstake tokens and claim rewards successfully", async () => {
    
            // mint and transfer 1500 COT to the smart contract
            const rewardAmount = ethers.utils.parseEther("1500");
            await fixtures.stakedToken.mint(fixtures.csProxy.address, rewardAmount);
    
            // stake 500 Cot to the smart contract
            const stakeAmount = ethers.utils.parseEther("500");
            await fixtures.stakedToken.approve(fixtures.csProxy.address, stakeAmount);
            await fixtures.csProxy.connect(fixtures.user).stake(stakeAmount);
        
            // Get the user's initial COT token balance before staking
            const userInitialBalance = await fixtures.stakedToken.balanceOf(fixtures.user.address);
            const stakeInfo = await fixtures.csProxy.getUserStake(fixtures.user.address);
    
            // advance 110 blocks (TODO: advance the necessary blocks to execute the unstake function)
            // NOTE: when executing unstaking it will increase one additional block!!
            const blockToAdvance = 110;
            for (let i = 0; i < blockToAdvance; i++) {
              await network.provider.send("evm_mine");
            }
    
            // compute expected reward (NOTE: we added 1 more block to compute it correctly)
            const expectedReward = stakeAmount.mul(fixtures.rewardRate).mul(blockToAdvance+1).div(fixtures.poolDuration).div(100);
    
            // execute unstake function
            await fixtures.csProxy.connect(fixtures.user).unstake();
            const userFinalBalance = await fixtures.stakedToken.balanceOf(fixtures.user.address);
            const diffBalance = userFinalBalance.sub(userInitialBalance);
    
            // the updated balance (amount got from the SC) should be equal to saked amount + expected Reward
            expect(diffBalance).to.be.equal(stakeAmount.add(expectedReward));
    
            
          });
        it("should revert if the user has not staked yet", async () => {
          await expect(fixtures.csProxy.connect(fixtures.user).unstake()).to.be.revertedWith("COTStaking: No active stake");
        });
        
    
        it("should revert if the minimum staking lock time is not reached", async () => {
          const stakeAmount = ethers.utils.parseEther("500");
          await fixtures.stakedToken.approve(fixtures.csProxy.address, stakeAmount);
          await fixtures.csProxy.connect(fixtures.user).stake(stakeAmount);
      
          await expect(fixtures.csProxy.connect(fixtures.user).unstake()).to.be.revertedWith(
            "COTStaking: Minimum staking lock time not reached"
          );
        });
      
      });
    
      describe("Restaking and rewards", function () {
    
        it("should update endBlock correctly when staking more tokens after the initial stake", async () => {
            const minStakingLockingTime = fixtures.minStakingLockTime;
    
            // First stake
            const stakeAmount1 = ethers.utils.parseEther("500");
            await fixtures.csProxy.connect(fixtures.user).stake(stakeAmount1);
    
            const initialBlockNumber = await ethers.provider.getBlockNumber();
          
            // Advance some blocks (half)
            const blocksToAdvance = 50;
            for (let i = 0; i < blocksToAdvance; i++) {
              await network.provider.send("evm_mine");
            }
    
            
            const stakeAmount2 = ethers.utils.parseEther("250");
            var secondStakeInfo = await fixtures.csProxy.getUserStake(fixtures.user.address);
            var userRewards = await fixtures.csProxy.userPendingRewards(fixtures.user.address);
    
            const pendingRewards = await fixtures.csProxy.userPendingRewards(fixtures.user.address);
            // console.log("Current reward: " + userRewards);
            await fixtures.csProxy.connect(fixtures.user).stake(stakeAmount2);
            secondStakeInfo = await fixtures.csProxy.getUserStake(fixtures.user.address);
            const currentEndBlock =  secondStakeInfo.endBlock;
            
    
            expect(initialBlockNumber + blocksToAdvance+1 + minStakingLockingTime ).to.equal(currentEndBlock);
            
    
          });
    
          it("should correctly unstake and compute rewards after staking multiple times", async () => {
    
            // transfer and mint 1500 tokens
            const rewardAmount = ethers.utils.parseEther("1500");
            await fixtures.stakedToken.mint(fixtures.csProxy.address, rewardAmount);
     
            // user initial balance of COT
            const userInitialBalance = await fixtures.stakedToken.balanceOf(fixtures.user.address);
            var blockNumber = await ethers.provider.getBlockNumber();
    
            // first stake of 500 COT
            const firstStakeAmount = ethers.utils.parseEther("500");
            await fixtures.stakedToken.approve(fixtures.csProxy.address, firstStakeAmount);
            await fixtures.csProxy.connect(fixtures.user).stake(firstStakeAmount);
            blockNumber = await ethers.provider.getBlockNumber();
    
    
            const firstBlocksToAdvance = 50;
            for (let i = 0; i < firstBlocksToAdvance; i++) {
              await network.provider.send("evm_mine");
            }
            
            // pending rewards from the first staking action
            var pendingRewards = await fixtures.csProxy.userPendingRewards(fixtures.user.address);
            var expectedFirstRewards = firstStakeAmount.mul(fixtures.rewardRate).mul(firstBlocksToAdvance).div(fixtures.poolDuration).div(100);
            expect (expectedFirstRewards).to.equal(pendingRewards);
            blockNumber = await ethers.provider.getBlockNumber();
    
            // second stake 250 more COT after advancing blocks
            const secondStakeAmount = ethers.utils.parseEther("250");
            await fixtures.csProxy.connect(fixtures.user).stake(secondStakeAmount);
            blockNumber = await ethers.provider.getBlockNumber();
    
    
            // we adjust this first rewards because the staking action
            expectedFirstRewards = firstStakeAmount.mul(fixtures.rewardRate).mul(firstBlocksToAdvance+1).div(fixtures.poolDuration).div(100);
    
             // pending rewards after second action
            pendingRewards = await fixtures.csProxy.userPendingRewards(fixtures.user.address);
            blockNumber = await ethers.provider.getBlockNumber();
            var userInfo = await fixtures.csProxy.getUserStake(fixtures.user.address);
    
            const secondBlocksToAdvance = 110;
            for (let i = 0; i < secondBlocksToAdvance; i++) {
              await network.provider.send("evm_mine");
            }
    
            // pending rewards after second action
            pendingRewards = await fixtures.csProxy.userPendingRewards(fixtures.user.address);
            blockNumber = await ethers.provider.getBlockNumber();
            userInfo = await fixtures.csProxy.getUserStake(fixtures.user.address);
    
            // unstake action
            await fixtures.csProxy.connect(fixtures.user).unstake();
            // const passedBlocks = firstBlocksToAdvance + secondBlocksToAdvance;
            
    
            // pending rewards after unstaking
            pendingRewards = await fixtures.csProxy.userPendingRewards(fixtures.user.address);
            blockNumber = await ethers.provider.getBlockNumber();
            
     
            const stakingSum = firstStakeAmount.add(secondStakeAmount);
            const expectedSecondRewards = stakingSum.mul(fixtures.rewardRate).mul(secondBlocksToAdvance+1).div(fixtures.poolDuration).div(100);
            const totalRewards = expectedSecondRewards.add(expectedFirstRewards);
    
    
            // user final balance of COT
            const userFinalBalance = await fixtures.stakedToken.balanceOf(fixtures.user.address);
            const diff = userFinalBalance.sub(userInitialBalance);
            expect (diff).to.equal(totalRewards);
    
            
        });
    
        it("should correctly calculate the remaining stake capacity", async () => {
          // Stake some amount of tokens
          const stakeAmount = ethers.utils.parseEther("500");
          await fixtures.stakedToken.approve(fixtures.csProxy.address, stakeAmount);
          await fixtures.csProxy.connect(fixtures.user).stake(stakeAmount);
      
          // Calculate the expected remaining stake capacity
          const expectedRemainingStakeCapacity = fixtures.poolSize.sub(stakeAmount);
      
          // Call the function and get the actual remaining stake capacity
          const actualRemainingStakeCapacity = await fixtures.csProxy.getRemainingStakeCapacity();
      
          // Check if the expected and actual values match
          expect(actualRemainingStakeCapacity).to.equal(expectedRemainingStakeCapacity);
        });
        
          
          
          
      });

      describe("updatePool", function () {
        it("should update the pool parameters correctly", async () => {
          // New pool parameters
          const newRewardRate = 20;
          const newPoolSize = ethers.utils.parseEther("20000");
          const newMaxStakePerUser = ethers.utils.parseEther("10000");
          const newPoolDuration = 300;
          const newMinStakingLockTime = 200;
      
          // Call the updatePool function
          await fixtures.csProxy.connect(fixtures.owner).updatePool(newRewardRate, newPoolSize, newMaxStakePerUser, newPoolDuration, newMinStakingLockTime);
      
          // Verify the new parameters
          expect(await fixtures.csProxy.rewardRate()).to.equal(newRewardRate);
          expect(await fixtures.csProxy.poolSize()).to.equal(newPoolSize);
          expect(await fixtures.csProxy.maxStakePerUser()).to.equal(newMaxStakePerUser);
          expect(await fixtures.csProxy.poolDuration()).to.equal(newPoolDuration);
          expect(await fixtures.csProxy.minStakingLockTime()).to.equal(newMinStakingLockTime);
        });
      
        it("should not allow non-admins to update the pool parameters", async () => {

          // Get the DEFAULT_ADMIN_ROLE from the contract
         const DEFAULT_ADMIN_ROLE = await fixtures.csProxy.DEFAULT_ADMIN_ROLE();
          // Construct the expected revert message
         const expectedRevertReason = `AccessControl: account ${fixtures.user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`;

          // New pool parameters
          const newRewardRate = 20;
          const newPoolSize = ethers.utils.parseEther("20000");
          const newMaxStakePerUser = ethers.utils.parseEther("10000");
          const newPoolDuration = 300;
          const newMinStakingLockTime = 200;
      
          // Try to call the updatePool function as a non-admin
          await expect(
            fixtures.csProxy.connect(fixtures.user).updatePool(newRewardRate, newPoolSize, newMaxStakePerUser, newPoolDuration, newMinStakingLockTime)
          ).to.be.revertedWith(expectedRevertReason);
      
          // The parameters should not have changed
          expect(await fixtures.csProxy.rewardRate()).to.equal(fixtures.rewardRate);
          expect(await fixtures.csProxy.poolSize()).to.equal(fixtures.poolSize);
          expect(await fixtures.csProxy.maxStakePerUser()).to.equal(fixtures.maxStakePerUser);
          expect(await fixtures.csProxy.poolDuration()).to.equal(fixtures.poolDuration);
          expect(await fixtures.csProxy.minStakingLockTime()).to.equal(fixtures.minStakingLockTime);
        });
      });
      
    
      describe("Negative tests", function () {
        // Stake negative test cases
        it("should revert when staking more tokens than the user's allowance", async () => {
          const stakeAmount = ethers.utils.parseEther("2000");
          await fixtures.stakedToken.approve(fixtures.csProxy.address, stakeAmount);
          await expect(fixtures.csProxy.connect(fixtures.user).stake(stakeAmount)).to.be.revertedWith("ERC20: insufficient allowance");
        });
      
        it("should revert when staking more tokens than the user's remaining stake capacity", async () => {
          const stakeAmount = ethers.utils.parseEther("5000");
          await fixtures.stakedToken.connect(fixtures.user).approve(fixtures.csProxy.address, stakeAmount);
          await expect(fixtures.csProxy.connect(fixtures.user).stake(stakeAmount)).to.be.revertedWith("COTStaking: Stake exceeds remaining user capacity");
        });
      
        it("should revert when staking 0 tokens", async () => {
          const stakeAmount = ethers.utils.parseEther("0");
          await expect(fixtures.csProxy.connect(fixtures.user).stake(stakeAmount)).to.be.revertedWith("COTStaking: Amount must be greater than zero");
        });
    
        it('should revert if initialized again', async function() {
    
          // Initialize the staking contract
          const poolSize = ethers.utils.parseEther("10000");
          const rewardRate = 10;
          const minStakingLockTime = 100;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("5000");
    
          await expect(fixtures.csProxy.initialize(
            ethers.constants.AddressZero,
            fixtures.treedefiWhitelist.address,
            poolSize,
            rewardRate,
            minStakingLockTime,
            poolDuration,
            maxStakePerUser,
          )).to.be.revertedWith('Initializable: contract is already initialized');
    
      
        });
    
        it('should fail if the COT token address is zero', async function() {
    
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
    
          // Initialize the staking contract
          const poolSize = ethers.utils.parseEther("10000");
          const rewardRate = 10;
          const minStakingLockTime = 100;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("5000");
    
          await expect(COTStaking.initialize(
            ethers.constants.AddressZero,
            fixtures.treedefiWhitelist.address,
            poolSize,
            rewardRate,
            minStakingLockTime,
            poolDuration,
            maxStakePerUser,
          )).to.be.revertedWith('COTStaking: COT token address must not be zero');
    
      
        });
    
    
        it('should fail if the pool size is zero', async function() {
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
          const rewardRate = 10;
          const minStakingLockTime = 100;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("5000");
        
          await expect(COTStaking.initialize(
            fixtures.stakedToken.address,
            fixtures.treedefiWhitelist.address,
            0,
            rewardRate,
            minStakingLockTime,
            poolDuration,
            maxStakePerUser,
          )).to.be.revertedWith('COTStaking: Pool size must be greater than zero');
        });
        
        it('should fail if the reward rate is zero or 100', async function() {
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
          const poolSize = ethers.utils.parseEther("10000");
          const minStakingLockTime = 100;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("5000");
        
          await expect(COTStaking.initialize(
            fixtures.stakedToken.address,
            fixtures.treedefiWhitelist.address,
            poolSize,
            0,
            minStakingLockTime,
            poolDuration,
            maxStakePerUser,
          )).to.be.revertedWith('COTStaking: Reward rate must be greater than zero and less than 100');
        
          await expect(COTStaking.initialize(
            fixtures.stakedToken.address,
            fixtures.treedefiWhitelist.address,
            poolSize,
            100,
            minStakingLockTime,
            poolDuration,
            maxStakePerUser,
          )).to.be.revertedWith('COTStaking: Reward rate must be greater than zero and less than 100');
        });
        
        it('should fail if the minimum stacking lock time is zero', async function() {
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
          const poolSize = ethers.utils.parseEther("10000");
          const rewardRate = 10;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("5000");
        
          await expect(COTStaking.initialize(
            fixtures.stakedToken.address,
            fixtures.treedefiWhitelist.address,
            poolSize,
            rewardRate,
            0,
            poolDuration,
            maxStakePerUser,
          )).to.be.revertedWith('COTStaking: Minimum stacking lock time must be greater than zero');
        });
        
        it('should fail if the pool duration is less than or equal to the minimum stacking lock time', async function() {
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
          const poolSize = ethers.utils.parseEther("10000");
          const rewardRate = 10;
          const minStakingLockTime = 100;
          const maxStakePerUser = ethers.utils.parseEther("5000");
        
          await expect(COTStaking.initialize(
            fixtures.stakedToken.address,      
            fixtures.treedefiWhitelist.address,  
            poolSize,
            rewardRate,
            minStakingLockTime,
            minStakingLockTime,
            maxStakePerUser,
          )).to.be.revertedWith('COTStaking: Pool duration must be greater than the minimum stacking lock time');
        });
    
    
        it("should revert when the staking amount exceeds the pool size", async () => {
    
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
    
          // Initialize the staking contract
          const poolSize = ethers.utils.parseEther("4000");
          const rewardRate = 10;
          const minStakingLockTime = 100;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("3000");
    
          await (COTStaking.initialize(
            fixtures.stakedToken.address,
            fixtures.treedefiWhitelist.address,
            poolSize,
            rewardRate,
            minStakingLockTime,
            poolDuration,
            maxStakePerUser,
          ))
    
          const stakeAmount = ethers.utils.parseEther("2500");
          await fixtures.stakedToken.connect(fixtures.owner).approve(COTStaking.address, stakeAmount);
          await fixtures.stakedToken.connect(fixtures.user).approve(COTStaking.address, stakeAmount);
          
          // owner will stake 
          await COTStaking.connect(fixtures.owner).stake(stakeAmount);
    
          // user will stake and get the error
          await expect(COTStaking.connect(fixtures.user).stake(stakeAmount))
              .to.be.revertedWith("COTStaking: Pool size limit reached");
        });
    
        it('should fail if max stake per user is zero', async function() {
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
          const poolSize = ethers.utils.parseEther("10000");
          const rewardRate = 10;
          const minStakingLockTime = 100;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("0");
        
          await expect(COTStaking.initialize(
            fixtures.stakedToken.address,
            fixtures.treedefiWhitelist.address,
            poolSize,
            rewardRate,
            minStakingLockTime,
            poolDuration,
            maxStakePerUser,
          )).to.be.revertedWith('COTStaking: Maximum stake per user must be greater than zero');
        });
    
        it('should fail if max stake per user is greater than pool size', async function() {
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
          const poolSize = ethers.utils.parseEther("10000");
          const rewardRate = 10;
          const minStakingLockTime = 100;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("20000");
        
          await expect(COTStaking.initialize(
            fixtures.stakedToken.address,
            fixtures.treedefiWhitelist.address,
            poolSize,
            rewardRate,
            minStakingLockTime,
            poolDuration,
            maxStakePerUser,
          )).to.be.revertedWith('COTStaking: Maximum stake per user must be less than or equal to the pool size');
        });
    
        it("should revert when staking after the pool has ended", async () => {
          const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStaking");
          const COTStaking = await COTStakingInitializable.deploy();
      
          // Initialize the staking contract
          const poolSize = ethers.utils.parseEther("4000");
          const rewardRate = 10;
          const minStakingLockTime = 100;
          const poolDuration = 200;
          const maxStakePerUser = ethers.utils.parseEther("3000");
      
          await (COTStaking.initialize(
              fixtures.stakedToken.address,
              fixtures.treedefiWhitelist.address,
              poolSize,
              rewardRate,
              minStakingLockTime,
              poolDuration,
              maxStakePerUser,
          ))
      
          const stakeAmount = ethers.utils.parseEther("2500");
          await fixtures.stakedToken.connect(fixtures.owner).approve(COTStaking.address, stakeAmount);
      
          // Fast-forward to after the pool end block
          const blocksToAdvance = poolDuration + 1;
          for (let i = 0; i < blocksToAdvance; i++) {
              await network.provider.send("evm_mine");
          }
      
          // Attempt to stake after the pool has ended
          await expect(COTStaking.connect(fixtures.owner).stake(stakeAmount))
              .to.be.revertedWith("COTStaking: This pool is finished");
      });
    
    
      
    
      });
      
    
      

      
      
    
});