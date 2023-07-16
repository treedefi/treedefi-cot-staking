// TreedefiCOTStakingUpgradeableV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TreedefiCOTStakingUpgradeable.sol";

contract TreedefiCOTStakingUpgradeableV2 is TreedefiCOTStakingUpgradeable {
    
    // Add the new variable to the contract
    uint256 public dummyVariable;

    // Add the new function to the contract
    function dummyFunction(uint256 newValue) public onlyRole(DEFAULT_ADMIN_ROLE) {
        dummyVariable = newValue;
    }

    // Override the function from the parent contract
    /**
     * @notice Returns the stake details for a specific user.
     * @param user The address of the user.
     * @return stake The user's stake details.
     */

    function getUserStake(address user) external override view returns (Stake memory) {
        return _stakes[user];
    }
    
}
