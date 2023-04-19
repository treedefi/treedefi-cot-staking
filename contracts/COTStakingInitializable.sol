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

}