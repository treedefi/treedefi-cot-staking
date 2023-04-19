// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// pragma abicoder v2; (from the Factory)

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract COTStakingInitializable is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

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

    mapping(address => Stake) private _stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

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

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "COTStaking: Amount must be greater than zero");
        require(_totalStaked + amount <= poolSize, "COTStaking: Pool size limit reached");

        Stake storage stake_ = _stakes[msg.sender];

        require(stake_.amount == 0, "COTStaking: User already staked");

        stake_.amount = amount;
        stake_.startBlock = block.number;
        stake_.endBlock = block.number + poolDuration;
        stake_.claimed = false;

        _totalStaked += amount;

        cotToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

    function unstake() external nonReentrant {
        Stake storage stake_ = _stakes[msg.sender];

        require(stake_.amount > 0, "COTStaking: No active stake");
        require(block.number >= stake_.endBlock, "COTStaking: Pool duration not reached");
        require(!stake_.claimed, "COTStaking: Rewards already claimed");

        uint256 reward = _calculateReward(stake_.amount, stake_.startBlock, stake_.endBlock);
        _lastBlockReward = stake_.endBlock;

        cotToken.safeTransfer(msg.sender, stake_.amount + reward);

        stake_.amount = 0;
        stake_.claimed = true;

        emit Unstaked(msg.sender, stake_.amount);
        emit RewardClaimed(msg.sender, reward);
    }

    /* internal functions */

    function _calculateReward(uint256 amount, uint256 startBlock, uint256 endBlock) private view returns (uint256) {
        uint256 blocksStaked = endBlock - startBlock;
        uint256 reward = (amount * blockRewardRate * blocksStaked) / poolDuration;
        return reward;
    }
    
    /* view functions */

    function getRemainingStakeCapacity() public view returns (uint256) {
        return poolSize - _totalStaked;
    }

    function getUserStake(address user) external view returns (Stake memory) {
        return _stakes[user];
    }


}