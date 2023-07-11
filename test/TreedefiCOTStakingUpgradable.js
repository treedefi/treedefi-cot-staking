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
    console.log("*** Starting tests ***");
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
      
    
});