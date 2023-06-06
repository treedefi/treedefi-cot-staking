// TreedefiCOTStaking.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;
import "hardhat/console.sol";

// OZ imports
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Treedefi imports
import {TreedefiWhitelist} from "./TreedefiWhitelist.sol";


/** @title COT Staking contract
 * @dev This contract uses a linear staking mechanism, 
 * @dev the amount of rewards earned by a user is proportional to the amount of tokens they have staked and the duration of their stake. 
 * @dev The contract calculates rewards using a formula that takes into account the stake amount, the reward rate, and the duration of the stake in blocks.
 * @notice This linear staking mechanism means that the longer a user stakes their tokens, the more rewards they will earn, 
 * @notice  as long as they stake for at least the minimum locking time required by the contract and less than maximum allowed per each user.
 * @author Treedefi LLC
*/ 

contract TreedefiCOTStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;
    using SafeMath for uint256;
    IERC20Metadata public cotToken;
    TreedefiWhitelist public whitelist;

    
    bool public isWhitelistEnabled = false;
    uint256 public poolSize; // maximum COT allowed to be staked in the pool
    uint256 public rewardRate; // reward rate in percentage 
    uint256 public minStackingLockTime; // minimum locking time in blocks
    uint256 public poolDuration; // pool duration in blocks
    uint256 public maxStakePerUser; // maximum stake amount per user

    uint256 public poolRewardEndBlock; // end block of the pool
    uint256 private _totalStaked;
    uint256 private _lastBlockReward;

    bool private initialized = false;

    /// @dev Represents an individual stake in the contract
    struct Stake {
        uint256 amount;       // The amount of tokens staked
        uint256 startBlock;   // The block number when the stake was created
        uint256 endBlock;     // The block number when the stake is set to end
        uint256 earnedRewards;// The total rewards earned from this stake
    }

    /// @dev Maps an address to its current stake
    mapping(address => Stake) private _stakes;

    /// @dev Emitted when a user stakes tokens
    event Staked(address indexed user, uint256 amount);

    /// @dev Emitted when a user unstakes tokens
    event Unstaked(address indexed user, uint256 amount);

    /// @dev Emitted when a user claims their reward tokens
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
        address whitelist_,
        uint256 poolSize_,
        uint256 rewardRate_,
        uint256 minStackingLockTime_,
        uint256 poolDuration_,
        uint256 maxStakePerUser_
    ) external onlyOwner {
        require(!initialized, "COTStaking: already initialized");
        require(cotToken_ != address(0), "COTStaking: COT token address must not be zero");
        require(poolSize_ > 0, "COTStaking: Pool size must be greater than zero");
        require(rewardRate_ > 0 && rewardRate_ < 100, "COTStaking: Reward rate must be greater than zero and less than 100");
        require(minStackingLockTime_ > 0, "COTStaking: Minimum stacking lock time must be greater than zero");
        require(poolDuration_ > minStackingLockTime_, "COTStaking: Pool duration must be greater than the minimum stacking lock time");
        require(maxStakePerUser_ > 0, "COTStaking: Maximum stake per user must be greater than zero");
        require(maxStakePerUser_ <= poolSize_, "COTStaking: Maximum stake per user must be less than or equal to the pool size");

        cotToken = IERC20Metadata(cotToken_);
        poolSize = poolSize_;
        rewardRate = rewardRate_;
        minStackingLockTime = minStackingLockTime_;
        poolDuration = poolDuration_;
        maxStakePerUser = maxStakePerUser_;

        poolRewardEndBlock = block.number.add(poolDuration_);
        initialized = true;
        whitelist = TreedefiWhitelist(whitelist_);

    }

    /**
    * @dev Toggles the state of the whitelist functionality. 
    *      If whitelist is enabled, it will be disabled and vice versa.
    *      This function can only be called by the owner of the contract.
    *
    * @notice This function allows the owner to enable or disable the whitelist functionality.
    *         If the whitelist is enabled, only addresses that are added to the whitelist
    *         can interact with the contract. If it is disabled, all addresses can interact with the contract.
    */

    function toggleWhitelist() external onlyOwner {
        isWhitelistEnabled = !isWhitelistEnabled;
    }

    /**
     * @notice Stakes a specified amount of COT tokens or increases an existing stake.
     * @dev If the user has an existing stake, the function updates the staked amount, endBlock, and earnedRewards.
     * @dev If the user doesn't have an existing stake, a new stake is created
     * @param amount The amount of COT tokens to stake.
     */
    function stake(uint256 amount) external nonReentrant {
        require(!isWhitelistEnabled || whitelist.isWhitelisted(msg.sender), "COTStaking: user is not whitelisted");
        require(amount > 0, "COTStaking: Amount must be greater than zero");
        require(_totalStaked.add(amount) <= poolSize, "COTStaking: Pool size limit reached");
        require (block.number < poolRewardEndBlock, "COTStaking: This pool is finished");

        Stake storage stake_ = _stakes[msg.sender];
        require(stake_.amount.add(amount) < maxStakePerUser, "COTStaking: Stake exceeds remaining user capacity");

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
        emit Unstaked(msg.sender, stake_.amount);

        _totalStaked = _totalStaked.sub(stake_.amount);

        // Clear the user stake structure
        stake_.amount = 0;
        stake_.startBlock = 0;
        stake_.endBlock = 0;
        stake_.earnedRewards = 0;

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
     * @notice Returns the remaining user capacity to stake
     * @param user The address of the user.
     * @return The user's remaining capacity amount
     */

    function getRemainingUserStakeCapacity(address user) external view returns (uint256) {
        return maxStakePerUser.sub(_stakes[user].amount);
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