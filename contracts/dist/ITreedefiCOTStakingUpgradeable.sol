// ITreedefiCOTStakingUpgradeable.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./TreedefiWhitelist.sol";

/** @title COT Staking interface
 * @dev This interface exposes methods for interacting with the COT Staking contract.
 * @author Treedefi LLC
*/ 
interface ITreedefiCOTStakingUpgradeable {

    // roles for access control
    function PAUSER_ROLE() external view returns(bytes32);
    function UPGRADER_ROLE() external view returns(bytes32);

    function cotToken() external view returns(ERC20Upgradeable);
    function whitelist() external view returns(TreedefiWhitelist);
    
    function blockStartDate() external view returns(uint256);
    function poolSize() external view returns(uint256);
    function rewardRate() external view returns(uint256);
    function minStakingLockTime() external view returns(uint256);
    function poolDuration() external view returns(uint256);
    function maxStakePerUser() external view returns(uint256);


    function poolRewardEndBlock() external view returns(uint256);
    function isWhitelistEnabled() external view returns(bool);

    struct Stake {
        uint256 amount;       
        uint256 startBlock;   
        uint256 endBlock;     
        uint256 earnedRewards;
    }

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    function initialize(
        address cotToken_,
        address whitelist_,
        uint256 blockStartDate_,
        uint256 poolSize_,
        uint256 rewardRate_,
        uint256 minStakingLockTime_,
        uint256 poolDuration_,
        uint256 maxStakePerUser_
    ) external;

    function toggleWhitelist() external;
    
    function updatePool(uint256 newRewardRate, 
                        uint256 newStartBlock,
                        uint256 newPoolSize, 
                        uint256 newMaxStakePerUser, 
                        uint256 newPoolDuration,
                        uint256 newMinStakingLockTime
                        ) external;

    function stake(uint256 amount) external;
    function unstake() external;

    function getRemainingStakeCapacity() external view returns (uint256);
    function getUserStake(address user) external view returns (Stake memory);
}
