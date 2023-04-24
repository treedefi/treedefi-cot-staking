// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "hardhat/console.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/// @title COT Staking Contract
/// @notice A contract for staking COT tokens and earning rewards.
contract COTStakingInitializable is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;
    using SafeMath for uint256;

    IERC20Metadata public cotToken;
    uint256 public poolSize; // maximum COT allowed to be staked in the pool
    uint256 public rewardRate; // reward rate in percentage 
    uint256 public minStackingLockTime; // minimum locking time in blocks
    uint256 public poolDuration; // pool duration in blocks

    uint256 private _totalStaked;
    uint256 private _lastBlockReward;

    struct Stake {
        uint256 amount;
        uint256 startBlock;
        uint256 endBlock;
        bool claimed;
    }

    mapping(address => Stake) private _stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    /// @notice Initializes the staking contract.
    /// @param cotToken_ The address of the COT token.
    /// @param poolSize_ The total size of the staking pool.
    /// @param rewardRate_ The rate at which rewards are earned as a percentage.
    /// @param minStackingLockTime_ The minimum lock time for staking.
    /// @param poolDuration_ The duration of the staking pool.

    function initialize(
        address cotToken_,
        uint256 poolSize_,
        uint256 rewardRate_,
        uint256 minStackingLockTime_,
        uint256 poolDuration_
    ) external onlyOwner {
        cotToken = IERC20Metadata(cotToken_);
        poolSize = poolSize_;
        rewardRate = rewardRate_;
        minStackingLockTime = minStackingLockTime_;
        poolDuration = poolDuration_;
    }

    // @notice Stakes a specified amount of COT tokens.
    // @param amount The amount of COT tokens to stake.
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "COTStaking: Amount must be greater than zero");
        require(_totalStaked.add(amount) <= poolSize, "COTStaking: Pool size limit reached");

        Stake storage stake_ = _stakes[msg.sender];

        require(stake_.amount == 0, "COTStaking: User already staked");

        stake_.amount = amount;
        stake_.startBlock = block.number;
        stake_.endBlock = block.number.add(minStackingLockTime);
        stake_.claimed = false;

        _totalStaked = _totalStaked.add(amount);

        cotToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

     /// @notice Unstakes tokens and claims rewards. TBD

    function unstake() external nonReentrant {
       
    }

    /**
     * @notice Calculate the pending rewards for a given stake.
     * @param amount The amount of COT tokens staked.
     * @param startBlock The starting block of the stake.
     * @param blockRewardRate The computed block reward rate based on user stake and reward rate.
     * @return pending_reward The calculated pending reward amount.
     */

    function _calculateReward(uint256 amount, uint256 startBlock, uint256 blockRewardRate) private view returns (uint256) {
        uint256 blockPassed = block.number.sub(startBlock);
        uint256 pending_reward = amount.mul(blockRewardRate).mul(blockPassed).div(poolDuration);
        return pending_reward;
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
     * @notice Calculate the pending rewards for a user.
     * @param user The address of the user to query the rewards for.
     * @return pendingRewards The pending rewards for the specified user.
     */

    function userPendingRewards(address user) public view returns (uint256 pendingRewards) {
    Stake storage stake_ = _stakes[user];

    if (stake_.amount > 0 && !stake_.claimed) {
       
        uint256 blockPassed = block.number.sub(stake_.startBlock);
        // convert user reward to 100
        uint256 userRewards = blockPassed.mul(rewardRate).mul(stake_.amount).div(poolDuration).div(100);
        pendingRewards = userRewards;

    }
    return pendingRewards;
}






}