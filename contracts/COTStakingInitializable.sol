// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
pragma abicoder v2;
import "hardhat/console.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/** @title COT Staking Contract
/* @notice A contract for staking COT tokens and earning rewards.
/* @author Hashdev LTD
*/ 

contract COTStakingInitializable is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;
    using SafeMath for uint256;

    IERC20Metadata public cotToken;
    uint256 public poolSize; // maximum COT allowed to be staked in the pool
    uint256 public rewardRate; // reward rate in percentage 
    uint256 public minStackingLockTime; // minimum locking time in blocks
    uint256 public poolDuration; // pool duration in blocks
    uint256 public poolRewardEndBlock; // end block of the pool
    uint256 public maxStakePerUser; // maximum stake amount per user

    uint256 private _totalStaked;
    uint256 private _lastBlockReward;

    struct Stake {
        uint256 amount;
        uint256 startBlock;
        uint256 endBlock;
        uint256 earnedRewards;
    }

    mapping(address => Stake) private _stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    /** 
    * @notice Initializes the staking contract
    * @param cotToken_ The address of the COT token
    * @param poolSize_ The total size of the staking pool as number of token accepted
    * @param rewardRate_ The rate at which rewards are earned as a percentage
    * @param minStackingLockTime_ The minimum lock time for staking as block numbers
    * @param poolDuration_ The duration of the staking pool as block numbers
    * */ 

    function initialize(
        address cotToken_,
        uint256 poolSize_,
        uint256 rewardRate_,
        uint256 minStackingLockTime_,
        uint256 poolDuration_,
        uint256 maxStakePerUser_
    ) external onlyOwner {
        cotToken = IERC20Metadata(cotToken_);
        poolSize = poolSize_;
        rewardRate = rewardRate_;
        minStackingLockTime = minStackingLockTime_;
        poolDuration = poolDuration_;
        maxStakePerUser = maxStakePerUser_;
        poolRewardEndBlock = block.number.add(poolDuration_);
    }

    /**
     * @notice Stakes a specified amount of COT tokens or increases an existing stake.
     * @dev If the user has an existing stake, the function updates the staked amount, endBlock, and earnedRewards.
     * If the user doesn't have an existing stake, a new stake is created.
     * @param amount The amount of COT tokens to stake.
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "COTStaking: Amount must be greater than zero");
        require(_totalStaked.add(amount) <= poolSize, "COTStaking: Pool size limit reached");

        Stake storage stake_ = _stakes[msg.sender];
        require(stake_.amount.add(amount) < maxStakePerUser, "COTStaking: Max stake per user reached");

        // If the user has an existing stake, update the staked amount and endBlock
        if (stake_.amount > 0) {
            uint256 pendingRewards = userPendingRewards(msg.sender);
            stake_.amount = stake_.amount.add(amount); // Update staked amount
            stake_.endBlock = block.number.add(minStackingLockTime);
            stake_.earnedRewards = stake_.earnedRewards.add(pendingRewards); // Update earned rewards
            stake_.startBlock = block.number; // Reset the start block
        }
        // If the user doesn't have an existing stake, create a new stake
        else {
            stake_.amount = amount;
            stake_.startBlock = block.number;
            stake_.endBlock = block.number.add(minStackingLockTime);
        }

        _totalStaked = _totalStaked.add(amount);

        cotToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }
   
    /**
    * @notice Unstakes tokens and claims rewards for the user
    * @dev This function checks if the user has an active stake, and if the minimum staking lock time is reached.
    * It then calculates the user's pending rewards, adds the earnedRewards,
    * transfers the unstaked tokens and rewards to the user, and updates the total staked amount and stake info.
    */
    
    function unstake() external nonReentrant {
        Stake storage stake_ = _stakes[msg.sender];

        require(stake_.amount > 0, "COTStaking: No active stake");
        require(block.number >= stake_.startBlock.add(minStackingLockTime), "COTStaking: Minimum staking lock time not reached");

        uint256 userRewards = userPendingRewards(msg.sender).add(stake_.earnedRewards); // Add the earnedRewards to the user's pending rewards

        cotToken.safeTransfer(msg.sender, stake_.amount.add(userRewards));

        _totalStaked = _totalStaked.sub(stake_.amount);

        // Clear the user stake structure
        stake_.amount = 0;
        stake_.startBlock = 0;
        stake_.endBlock = 0;
        stake_.earnedRewards = 0;

        emit Unstaked(msg.sender, stake_.amount);
        emit RewardClaimed(msg.sender, userRewards);
    }


    /**
     * @notice Returns the remaining stake capacity in the pool.
     * @return The remaining stake capacity.
     */

    function getRemainingStakeCapacity() public view returns (uint256) {
        return poolSize.sub(_totalStaked);
    }

    /**
     * @notice Returns the stake details for a specific user.
     * @param user The address of the user.
     * @return stake The user's stake details.
     */

    function getUserStake(address user) external view returns (Stake memory) {
        return _stakes[user];
    }

    /**
     * @notice Returns COT balance of this contract
     */

    function getCOTBalance() public view returns (uint256) {
        return cotToken.balanceOf(address(this));
    }

    /**
     * @notice Calculate the pending rewards for a user.
     * @param user The address of the user to query the rewards for.
     * @return pendingRewards The pending rewards for the specified user.
     */

    function userPendingRewards(address user) public view returns (uint256 pendingRewards) {
    Stake storage stake_ = _stakes[user];

    if (stake_.amount > 0) {
        uint256 blockPassed;

        // Check if the current block number is greater than the poolRewardEndBlock
        if (block.number >= poolRewardEndBlock) {
            uint256 effectiveEndBlock = (stake_.startBlock.add(poolDuration) > poolRewardEndBlock) ? poolRewardEndBlock : stake_.startBlock.add(poolDuration);
            blockPassed = effectiveEndBlock.sub(stake_.startBlock);
        } else {
            blockPassed = block.number.sub(stake_.startBlock);
        }

        // Divide userRewards by 100 because rewardRate is a percentage
        uint256 userRewards = blockPassed.mul(rewardRate).mul(stake_.amount).div(poolDuration).div(100);
        pendingRewards = userRewards;
    }
    return pendingRewards;
}




}