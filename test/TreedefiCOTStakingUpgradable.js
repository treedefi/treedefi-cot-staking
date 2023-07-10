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
    const minStackingLockTime = 100;
    const poolDuration = 200;
    const maxStakePerUser = ethers.utils.parseEther("5000");

  const COTStakingInitializable = await ethers.getContractFactory("TreedefiCOTStakingUpgradeable");
  const COTStaking = await COTStakingInitializable.deploy();
  
  // To deploy our Proxy, we just have to call upgrades.deployProxy() and await
  // its deployed() method, which happens once its transaction has been
  // mined.

  const csProxy = await upgrades.deployProxy(COTStakingInitializable, [stakedToken.address, treedefiWhitelist.address, poolSize, rewardRate, minStackingLockTime, poolDuration, maxStakePerUser], { initializer: "initialize" });
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
    minStackingLockTime,
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
          expect(await fixtures.csProxy.minStackingLockTime()).to.equal(fixtures.minStackingLockTime);
          expect(await fixtures.csProxy.poolDuration()).to.equal(fixtures.poolDuration);
          expect(await fixtures.csProxy.maxStakePerUser()).to.equal(fixtures.maxStakePerUser);
          // expect(await fixtures.csProxy.owner()).to.equal(fixtures.owner.address);
          
          // allow 2 blocks tolerance
          expect(await fixtures.csProxy.poolRewardEndBlock()).to.be.closeTo(endBlock,2);
    
        });
      });
    
});