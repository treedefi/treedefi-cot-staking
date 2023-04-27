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

## Unit Tests

To ensure the correct functionality of the COT Staking Contract, unit tests should be written to test each function and verify the expected behavior. These tests will help identify any issues or bugs in the contract, ensuring its security and reliability.

## Simulations

To demonstrate the functionality of the COT Staking Contract and visualize the rewards earned by users over time, we created a Python scripts using data generated by the contract. These simulations will help users understand the potential returns from staking their tokens, as well as provide insights into the overall performance of the staking contract.
