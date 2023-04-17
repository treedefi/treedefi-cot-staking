# Project Structure

In this repo, you can find the main smart contracts for Treedefi Staking.

## Compiling Contracts

To compile the contracts, run the following command:

`npx hardhat compile`

This will compile all contracts located in the `contracts/` directory and output the compiled artifacts to the `artifacts/` directory.

## Running Tests

To run your tests, run the following command:

`npx hardhat test`

This will run all tests located in the `test/` directory.

If you want to run a specific test file, you can pass the path to that file as an argument

## APR Calculation for Staking Pool

The Annual Percentage Rate (APR) is calculated using the following formula:

APR = (Reward Rate * Total Rewards Per Year) / Total Staked Tokens

#### Variables

- `Reward Rate`: The proportion of rewards distributed to stakers.
- `Total Rewards Per Year`: The total amount of rewards distributed to stakers in one year.
- `Total Staked Tokens`: The total amount of tokens staked in the pool.

#### Steps

1. Determine the `Reward Rate`. This can be found in the staking pool smart contract or provided by the platform.
2. Calculate the `Total Rewards Per Year` by multiplying the reward rate with the total amount of tokens minted or allocated for rewards in one year.
3. Find the `Total Staked Tokens` in the pool, which can be obtained from the smart contract or the platform.
4. Divide the `Total Rewards Per Year` by the `Total Staked Tokens` to get the APR.

Keep in mind that APR can change over time as more tokens are staked, unstaked, or rewarded.

