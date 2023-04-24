// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
// pragma abicoder v2; (from the Factory)

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
    uint256 public poolSize;
    uint256 public blockRewardRate;
    uint256 public rewardTokensValue;
    uint256 public minStackingLockTime;
    uint256 public poolDuration;

    uint256 private _totalStaked;
    uint256 private _lastBlockReward;

    struct Stake {
        uint256 amount;
        uint256 startBlock;
        uint256 endBlock;
        bool claimed;
    }

    struct UserInfo {
        uint256 amount;     // How many tokens the user has provided.
        uint256 rewardDebt; // Reward debt.
    }

    mapping (address => UserInfo) public users;
    mapping(address => Stake) private _stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    /// @notice Initializes the staking contract.
    /// @param cotToken_ The address of the COT token.
    /// @param poolSize_ The total size of the staking pool.
    /// @param blockRewardRate_ The rate at which rewards are earned per block.
    /// @param minStackingLockTime_ The minimum lock time for staking.
    /// @param poolDuration_ The duration of the staking pool.

    function initialize(
        address cotToken_,
        uint256 poolSize_,
        uint256 blockRewardRate_,
        uint256 minStackingLockTime_,
        uint256 poolDuration_

    ) external onlyOwner {
        cotToken = IERC20Metadata(cotToken_);
        poolSize = poolSize_;
        blockRewardRate = blockRewardRate_;
        minStackingLockTime = minStackingLockTime_;
        poolDuration = poolDuration_;
        rewardTokensValue = poolSize * blockRewardRate;
    }

    // @notice Stakes a specified amount of COT tokens.
    // @param amount The amount of COT tokens to stake.
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "COTStaking: Amount must be greater than zero");
        require(_totalStaked + amount <= poolSize, "COTStaking: Pool size limit reached");

        Stake storage stake_ = _stakes[msg.sender];

        require(stake_.amount == 0, "COTStaking: User already staked");

        stake_.amount = amount;
        stake_.startBlock = block.number;
        stake_.endBlock = block.number + minStackingLockTime;
        stake_.claimed = false;

        _totalStaked += amount;

        cotToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

     /// @notice Unstakes tokens and claims rewards.
    function unstake() external nonReentrant {
        Stake storage stake_ = _stakes[msg.sender];

        require(stake_.amount > 0, "COTStaking: No active stake");
        require(block.number >= stake_.startBlock + minStackingLockTime, "COTStaking: Minimum staking lock time not reached");
        require(!stake_.claimed, "COTStaking: Rewards already claimed");

        uint256 reward = _calculateReward(stake_.amount, stake_.startBlock, block.number);
        _lastBlockReward = block.number;

        cotToken.safeTransfer(msg.sender, stake_.amount);
        cotToken.safeTransfer(msg.sender, reward);

        emit Unstaked(msg.sender, stake_.amount);
        stake_.amount = 0;
        stake_.claimed = true;

        emit RewardClaimed(msg.sender, reward);
    }


    /* internal functions */
    
    /// @notice Calculates the reward for a given stake.
    /// @param amount The amount of COT tokens staked.
    /// @param startBlock The starting block of the stake.
    /// @param endBlock The ending block of the stake.
    /// @return reward The calculated reward amount.

    function _calculateReward(uint256 amount, uint256 startBlock, uint256 endBlock) private view returns (uint256) {
        uint256 blocksStaked = endBlock.sub(startBlock);
        uint256 reward = amount.mul(blockRewardRate).mul(blocksStaked).div(poolDuration);
        return reward;
    }
    
    /* view functions */
    /// @notice Returns the remaining stake capacity in the pool.
    /// @return The remaining stake capacity.
    function getRemainingStakeCapacity() public view returns (uint256) {
        return poolSize - _totalStaked;
    }

    /// @notice Returns the stake details for a specific user.
    /// @param user The address of the user.
    /// @return stake The user's stake details.
    function getUserStake(address user) external view returns (Stake memory) {
        return _stakes[user];
    }

  /**
 * @notice Calculate the pending rewards for a user
 * @param user The address of the user to query the rewards for
 * @return pendingRewards The pending rewards for the specified user
 */
function userPendingRewards(address user) public view returns (uint256 pendingRewards) {
    Stake storage stake_ = _stakes[user];

    if (stake_.amount > 0 && !stake_.claimed) {
        uint256 endBlock = block.number < stake_.endBlock ? block.number : stake_.endBlock;
        pendingRewards = _calculateReward(stake_.amount, stake_.startBlock, endBlock);
    }
}


}