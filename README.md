# COT Staking Contract Documentation

## Overview

The COT Staking Contract is a decentralized staking contract that allows users to stake their COT tokens to earn rewards over time. The rewards are calculated based on the amount of tokens staked, the duration of the stake, and the specified reward rate. The staking mechanism used is linear, meaning that rewards earned by a user are directly proportional to the amount and duration of their staked tokens. This document outlines the structure, functions, and features of the COT Staking Contract, as well as unit tests and simulations used for testing and demonstrating its functionality.

## Initialization Parameters

The COT Staking Contract requires the following parameters for initialization:

1. `cotToken_`: The address of the COT token.
2. `poolSize_`: The total size of the staking pool, denoted as the number of tokens accepted.
3. `rewardRate_`: The rate at which rewards are earned as a percentage.
4. `minStackingLockTime_`: The minimum lock time for staking, denoted in block numbers.
5. `poolDuration_`: The duration of the staking pool, denoted in block numbers.
6. `maxStakePerUser_`: The maximum stake amount allowed per user.

## Writing Functions

The COT Staking Contract includes several writing functions that allow users to interact with the contract and manage their staked tokens:

1. `stake(uint256 amount)`: Allows a user to stake a specified amount of tokens or increase an existing stake.
2. `unstake()`: Allows a user to unstake their tokens and claim rewards.

## Reading Functions

The COT Staking Contract provides several reading functions that allow users to obtain information about their staked tokens and rewards:

1. `getRemainingStakeCapacity()`: Returns the remaining stake capacity in the pool.
2. `getUserStake(address user)`: Returns the stake details for a specific user.
3. `getRemainingUserStakeCapacity(address user)`: Returns the remaining user capacity to stake.
4. `getCOTBalance()`: Returns the COT balance of the contract.
5. `userPendingRewards(address user)`: Calculates and returns the pending rewards for a specific user.
### Constraints

In the COT Staking contract, there are several constraints that must be adhered to for proper functioning:

1. The COT token address must not be a zero address.
2. The pool size must be greater than zero.
3. The reward rate must be greater than zero and less than 100.
4. The minimum staking lock time must be greater than zero.
5. The pool duration must be greater than the minimum staking lock time.
6. The maximum stake per user must be greater than zero and less than or equal to the pool size.

### Adding a New Stake to the Contract

When a new stake is added to the contract, the following steps are executed:

1. The stake amount is checked against the constraints:
   * The stake amount must be greater than zero
   * The stake amount must not exceed the pool size
   * The stake amount must not exceed the maximum stake per user
2. The current block number is checked to ensure the pool is still active (i.e., before the pool reward end block).
3. If the user has an existing stake:
   * The pending rewards are calculated and added to the user's earned rewards.
   * The staked amount is updated with the new stake.
   * The end block of the stake is updated to the current block number plus the minimum staking lock time.
   * The start block of the stake is updated to the current block number.
4. If the user doesn't have an existing stake:
   * A new stake is created with the specified amount.
   * The start block of the stake is set to the current block number.
   * The end block of the stake is set to the current block number plus the minimum staking lock time.
5. The total staked amount is updated by adding the new stake amount.
6. The COT tokens are transferred from the user to the contract.
7. A `Staked` event is emitted, containing the user's address and the stake amount.

The pool duration is specified in block numbers, which represents the number of blocks the staking pool will be active for. The pool reward end block is calculated by adding the pool duration to the current block number at the time of contract initialization. This ensures that the staking pool will remain active for the specified number of blocks, after which no new stakes can be added, and users can unstake and claim their rewards.


## Unit Tests

To ensure the correct functionality of the COT Staking Contract, unit tests should be written to test each function and verify the expected behavior. These tests will help identify any issues or bugs in the contract, ensuring its security and reliability.

## Simulations

To demonstrate the functionality of the COT Staking Contract and visualize the rewards earned by users over time, we created a Python scripts using data generated by the contract. These simulations will help users understand the potential returns from staking their tokens, as well as provide insights into the overall performance of the staking contract.
