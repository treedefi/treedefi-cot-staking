// TreedefiCOTStakingUpgradeable.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;
import "hardhat/console.sol";

// OZ upgradable imports
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// Treedefi imports
import {ITreedefiCOTStakingUpgradeable} from "./ITreedefiCOTStakingUpgradeable.sol";
import {TreedefiWhitelist} from "./TreedefiWhitelist.sol";


/** @title COT Staking contract
 * @dev This contract uses a linear staking mechanism, 
 * @dev the amount of rewards earned by a user is proportional to the amount of tokens they have staked and the duration of their stake. 
 * @dev The contract calculates rewards using a formula that takes into account the stake amount, the reward rate, and the duration of the stake in blocks.
 * @notice This linear staking mechanism means that the longer a user stakes their tokens, the more rewards they will earn, 
 * @notice  as long as they stake for at least the minimum locking time required by the contract and less than maximum allowed per each user.
 * @author Treedefi LLC
*/ 

contract TreedefiCOTStakingUpgradeable is 
    ITreedefiCOTStakingUpgradeable,
    Initializable,
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    AccessControlUpgradeable,
    UUPSUpgradeable { 

    /**
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    
    constructor() {
        _disableInitializers();
    }

    // roles for access control
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    

    ERC20Upgradeable public cotToken;
    TreedefiWhitelist public whitelist;
    
    uint256 public blockStartDate; // start date of the pool
    uint256 public poolSize; // maximum COT allowed to be staked in the pool
    uint256 public rewardRate; // reward rate in percentage 
    uint256 public minStakingLockTime; // minimum locking time in blocks
    uint256 public poolDuration; // pool duration in blocks
    uint256 public maxStakePerUser; // maximum stake amount per user


    uint256 public poolRewardEndBlock; // end block of the pool
    uint256 internal _totalStaked; // total amount of COT staked in the pool
    uint256 internal _lastBlockReward; // last block number when rewards are calculated

    bool public isWhitelistEnabled; // flag to check if whitelist is enabled

    /// @dev Maps an address to its current stake
    mapping(address => Stake) internal _stakes;

   /** 
    * @notice Initializes the staking contract
    * @param cotToken_ The address of the COT token. Must be a valid ERC20 address.
    * @param whitelist_ The address of the whitelist contract.
    * @param blockStartDate_ The block number from which the staking pool will start accepting stakes.
    *                        Must be a future block number.
    * @param poolSize_ The total number of tokens that the staking pool will accept.
    *                  Must be greater than zero.
    * @param rewardRate_ The rate of rewards, represented as a percentage.
    *                    Must be greater than zero and less than 100.
    * @param minStakingLockTime_ The minimum number of blocks for which a stake must be locked.
    *                            Must be greater than zero.
    * @param poolDuration_ The duration of the staking pool, represented in blocks.
    *                      Must be greater than minStakingLockTime_.
    * @param maxStakePerUser_ The maximum number of tokens that a single user can stake in the pool.
    *                         Must be greater than zero and less than or equal to poolSize_.
    */
function initialize(
        address cotToken_,
        address whitelist_,
        uint256 blockStartDate_,
        uint256 poolSize_,
        uint256 rewardRate_,
        uint256 minStakingLockTime_,
        uint256 poolDuration_,
        uint256 maxStakePerUser_
    ) initializer public {
        // Perform input validity checks
        require(blockStartDate_ > block.number, "COTStaking: Block start date must be in the future");
        require(cotToken_ != address(0), "COTStaking: COT token address must not be zero");
        require(poolSize_ > 0, "COTStaking: Pool size must be greater than zero");
        require(rewardRate_ > 0 && rewardRate_ < 100, "COTStaking: Reward rate must be between 0 (exclusive) and 100 (exclusive)");
        require(minStakingLockTime_ > 0, "COTStaking: Minimum staking lock time must be greater than zero");
        require(poolDuration_ > minStakingLockTime_, "COTStaking: Pool duration must exceed minimum staking lock time");
        require(maxStakePerUser_ > 0 && maxStakePerUser_ <= poolSize_, "COTStaking: Maximum stake per user must be within (0, poolSize_]");

        // Assign the input parameters to state variables
        cotToken = ERC20Upgradeable(cotToken_);
        whitelist = TreedefiWhitelist(whitelist_);
        blockStartDate = blockStartDate_;
        poolSize = poolSize_;
        rewardRate = rewardRate_;
        minStakingLockTime = minStakingLockTime_;
        poolDuration = poolDuration_;
        maxStakePerUser = maxStakePerUser_;
        poolRewardEndBlock = blockStartDate_ + poolDuration_;
        isWhitelistEnabled = false;

        // Assign the roles to the message sender
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
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

    function toggleWhitelist() public onlyRole(DEFAULT_ADMIN_ROLE) {
        isWhitelistEnabled = !isWhitelistEnabled;
    }

    /**
     * @dev Updates the reward rate, pool size, maximum stake per user, pool duration, and minimum staking lock time.
     * @dev Can only be called by the contract owner
     * @param newRewardRate The new reward rate to be set
     * @param newPoolSize The new pool size to be set
     * @param newMaxStakePerUser The new maximum stake per user to be set
     * @param newPoolDuration The new pool duration to be set
     * @param newMinStakingLockTime The new minimum staking lock time to be set
     */

    function updatePool(uint256 newRewardRate, 
                        uint256 newStartBlock,
                        uint256 newPoolSize, 
                        uint256 newMaxStakePerUser, 
                        uint256 newPoolDuration,
                        uint256 newMinStakingLockTime
                        ) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRewardRate > 0 && newRewardRate < 100, "COTStaking: Reward rate must be between 1 and 99");
        require (newStartBlock >= block.number, "COTStaking: Start block should be greater than current block number");
        require(newPoolSize > 0, "COTStaking: Pool size should be greater than 0 COT");
        require(newMaxStakePerUser > 0, "COTStaking: Stake per user should be greater than 0 COT");
        require(newPoolDuration > 0, "COTStaking: Pool duration should be greater than 0 blocks");
        require(newMinStakingLockTime > 0, "COTStaking: Minimum staking lock time should be greater than 0 blocks");
        rewardRate = newRewardRate;
        poolSize = newPoolSize;
        maxStakePerUser = newMaxStakePerUser;
        poolDuration = newPoolDuration;
        minStakingLockTime = newMinStakingLockTime;
        poolRewardEndBlock = newStartBlock + poolDuration; // update the pool end block
    }

    /**
     * @notice Stakes a specified amount of COT tokens or increases an existing stake.
     * @dev If the user has an existing stake, the function updates the staked amount, endBlock, and earnedRewards.
     * @dev If the user doesn't have an existing stake, a new stake is created
     * @param amount The amount of COT tokens to stake.
     */
    function stake(uint256 amount) external virtual whenNotPaused nonReentrant {
        require(!isWhitelistEnabled || whitelist.isWhitelisted(msg.sender), "COTStaking: user is not whitelisted");
        require(block.number >= blockStartDate, "COTStaking: Pool is not started yet");
        require(amount > 0, "COTStaking: Amount must be greater than zero");
        require( (_totalStaked + amount) <= poolSize, "COTStaking: Pool size limit reached");
        require (block.number < poolRewardEndBlock, "COTStaking: This pool is finished");

        Stake storage stake_ = _stakes[msg.sender];
        require( (stake_.amount + amount) < maxStakePerUser, "COTStaking: Stake exceeds remaining user capacity");

        // If the user has an existing stake, update the staked amount and endBlock
        if (stake_.amount > 0) {
            uint256 pendingRewards = userPendingRewards(msg.sender);
            stake_.amount += amount; // Update staked amount
            stake_.endBlock = block.number + minStakingLockTime;
            stake_.earnedRewards = stake_.earnedRewards + pendingRewards; // Update earned rewards
            stake_.startBlock = block.number; // Reset the start block
        }
        // If the user doesn't have an existing stake, create a new stake
        else {
            stake_.amount = amount;
            stake_.startBlock = block.number;
            stake_.endBlock = block.number + minStakingLockTime;
        }

        _totalStaked = _totalStaked + amount;
        cotToken.transferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }
   
    /**
    * @notice Unstakes tokens and claims rewards for the user
    * @dev This function checks if the user has an active stake, and if the minimum staking lock time is reached.
    * It then calculates the user's pending rewards, adds the earnedRewards,
    * transfers the unstaked tokens and rewards to the user, and updates the total staked amount and stake info.
    */
    
    function unstake() external virtual whenNotPaused nonReentrant {
        Stake storage stake_ = _stakes[msg.sender];

        require(stake_.amount > 0, "COTStaking: No active stake");
        require(block.number >= (stake_.startBlock + minStakingLockTime), "COTStaking: Minimum staking lock time not reached");

        uint256 userRewards = userPendingRewards(msg.sender) + stake_.earnedRewards; // Add the earnedRewards to the user's pending rewards
        cotToken.transfer(msg.sender, stake_.amount + userRewards);
        emit Unstaked(msg.sender, stake_.amount);

        _totalStaked -= stake_.amount;

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

    function getRemainingStakeCapacity() external virtual view returns (uint256) {
        return poolSize - _totalStaked;
    }

    /**
     * @notice Returns the stake details for a specific user.
     * @param user The address of the user.
     * @return stake The user's stake details.
     */

    function getUserStake(address user) external virtual view returns (Stake memory) {
        return _stakes[user];
    }

    /**
     * @notice Returns the remaining user capacity to stake
     * @param user The address of the user.
     * @return The user's remaining capacity amount
     */

    function getRemainingUserStakeCapacity(address user) external virtual view returns (uint256) {
        return maxStakePerUser - _stakes[user].amount;
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
            uint256 effectiveEndBlock = (  (stake_.startBlock + poolDuration) > poolRewardEndBlock) ? poolRewardEndBlock : stake_.startBlock + poolDuration;
            blockPassed = effectiveEndBlock - (stake_.startBlock);
        } else {
            blockPassed = block.number - stake_.startBlock;
        }

        // Divide userRewards by 100 because rewardRate is a percentage
        uint256 userRewards = blockPassed*(rewardRate)*(stake_.amount)/(poolDuration)/(100);
        pendingRewards = userRewards;
    }
    return pendingRewards;
}

    /**
     * @notice pause and unpause functions
     * @dev Requires PAUSER_ROLE to be able pause  the contract
     */
    function pauseContract() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

     /**
     * @notice unpause function
     * @dev Requires PAUSER_ROLE to be able to unpause the contract
     */

    function unpauseContract() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
        
    /**
     * @dev Authorizes a new implementation for upgrading the contract
     * @param newImplementation The address of the new implementation
     * @dev Requires UPGRADER_ROLE
     */

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

}