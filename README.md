# TreedefiCOTStakingUpgradeable Contract Documentation

## 1. Overview

This documentation covers the functionality of the TreedefiCOTStakingUpgradeable contract. This contract allows users to stake COT tokens and earn rewards over time.

## 2. Initialization parameters

The `initialize` function takes the following parameters:

- `cotToken_`: The address of the COT token.
- `whitelist_`: The address of the whitelist.
- `blockStartDate_`: The start date of the staking in block number.
- `poolSize_`: The total amount of tokens in the pool.
- `rewardRate_`: The rate of reward per block.
- `minStakingLockTime_`: The minimum amount of time a user must stake their tokens to receive rewards.
- `poolDuration_`: The duration of the pool.
- `maxStakePerUser_`: The maximum amount a user can stake.

## 3. Writing functions (user and admin)

Writing functions can only be called by users or admins and modify the state of the contract.

- `toggleWhitelist()`: Toggles the whitelist on or off.
- `updatePool()`: Updates the parameters of the pool.
- `stake()`: Allows a user to stake tokens.
- `unstake()`: Allows a user to unstake tokens.

## 4. Reading functions

Reading functions are view functions that do not modify the state of the contract.

- `getRemainingStakeCapacity()`: Returns the remaining stake capacity.
- `getUserStake()`: Returns the stake details of a user.

## 5. Constraints

There are some constraints on the staking contract:

- Users cannot stake more tokens than the `maxStakePerUser`.
- Users cannot stake if the whitelist is enabled and they are not on it.

## 6. Adding a new stake in the contract

To add a new stake, call the `stake()` function with the amount of tokens you want to stake. The tokens will be locked in the contract until you call `unstake()`.
